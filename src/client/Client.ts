import * as Sentry from '@sentry/node';
import MessageTaskList from 'discord-message-tasks';
import { Client, ClientOptions } from 'discord.js';
import enmap from 'enmap';
import lagThingy from 'event-loop-lag';
import http from 'http';
import { Pool } from 'pg';
import readdir from 'readdirp';
import { Config } from '../../configs/config';
import AudioStorage from '../classes/AudioStorage';
import { Command } from '../structures/Command';
import { logger } from '../structures/utils/Logger';
export class BClient extends Client {
    public config= Config;
    public dtl: any;
    public commands: Map<string, Command>;
    public ready: boolean;
    public settings: enmap;
    public usage: enmap;
    public messagesPerSecond: number;
    public messageCount: number;
    public pg: Pool;
    public AudioStorage: AudioStorage;
    public taskList: MessageTaskList;
    public readonly lag: Function;

    public constructor(opts: ClientOptions) {
        super(opts);
        this.lag = lagThingy(1000);
        this.pg = new Pool({
            connectionString: process.env.PSQL,
        });
        this.AudioStorage = new AudioStorage(this.pg, Config.audio.storage);
        this.commands = new Map<string, Command>();
        this.ready = false;
        if (process.env.NODE_ENV === 'production') Sentry.init({ dsn: process.env.SENTRYURL });
        else logger.warn('process is not running in production');
        this.dtl = new (require('discord-message-tasks'))(Config.emojis.empty, Config.emojis.done);
        this.once('ready', (): boolean => this.ready = true);
        this.settings = new enmap({ name: 'settings' });
        this.usage = new enmap({ name: 'usage' });
        this.messagesPerSecond = 0;
        this.taskList = new MessageTaskList(Config.emojis.loading, Config.emojis.done);
    }

    public loadModules(): void {
        readdir(`${__dirname}/../commands/`, {
            fileFilter: ['*.ts', '*.js'],
        })
            .on('data', (e: any): void => {
                this.commands.set(e.basename.split('.')[0], new (require(e.fullPath).default)(this));
            })
            .on('end', (): void => {
                logger.debug(`loaded ${this.commands.size} commands`);
            });

        let events = 0;
        readdir(`${__dirname}/../events/`, {
            fileFilter: ['*.ts', '*.js'],
        })
            .on('data', (e: any): void => {
                this.on(e.basename.split('.')[0], require(e.fullPath).bind(null, this));
                events++;
            })
            .on('end', (): void => {
                logger.debug(`loaded ${events} events`);
            });
    }

    public _init(): void {
        http.createServer((req, res) => {
            const mapped = this.ws.shards.map(x => x.status);
            if (mapped.length === 0) mapped.push(5);
            res.writeHead(
                mapped.every(a => a === 0) ? 200 : 500, {
                'Content-Type': 'application/json',
            });
            res.write(JSON.stringify(mapped));
            res.end();
        }).listen(3001);

        require('appmetrics-dash').monitor({
            port: 8000, console: {
                log: logger.info,
                error: logger.error,
            },
        });
    }

    public start(): void {
        this.loadModules();

        this._init();
        this.login(process.env.BTOKEN);
    }
}
