import * as Sentry from '@sentry/node';
import MessageTaskList from 'discord-message-tasks';
import { Client, ClientOptions, PresenceData } from 'discord.js';
import enmap from 'enmap';
import { Pool } from 'pg';
import readdir from 'readdirp';
import express from 'express';

import { Config } from '../../configs/generalConfig';
import AudioStorage from '../classes/AudioStorage';
import { logger } from '../structures/utils/Logger';
import { Command } from '../structures/Command';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config');

export class BClient extends Client {
    public config: Config;
    public sentry: any;
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

    public constructor(opts: ClientOptions) {
        super(opts);
        this.pg = new Pool({
            connectionString: process.env.PSQL,
        });
        this.AudioStorage = new AudioStorage(this.pg, config.audio.storage);
        this.commands = new Map<string, Command>();
        this.config = config;
        this.sentry = Sentry;
        this.ready = false;
        if (process.env.NODE_ENV === 'production') this.sentry.init({ dsn: process.env.SENTRYURL });
        else logger.warn('process is not running in production');
        this.dtl = new (require('discord-message-tasks'))(config.emojis.empty, config.emojis.done);
        this.once('ready', (): boolean => this.ready = true);
        this.settings = new enmap({ name: 'settings' });
        this.usage = new enmap({ name: 'usage' });
        this.messagesPerSecond = 0;
        this.taskList = new MessageTaskList(config.emojis.loading, config.emojis.done);
    }

    public loadModules() {
        readdir(`${__dirname}/commands/`, {
            fileFilter: ['*.ts', '*.js'],
        })
            .on('data', (e: any): void => {
                this.commands.set(e.basename.split('.')[0], new (require(e.fullPath).default)(this));
            })
            .on('end', (): void => {
                logger.debug(`loaded ${this.commands.size} commands`);
            });
    
        let events = 0;
        readdir(`${__dirname}/events/`, {
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

    public async _init() {
        express().get('/', (req, res) => {
            const mapped = this.ws.shards.map(x => x.status);
            if (mapped.length === 0) mapped.push(5);
            res.status(mapped.every(a => a === 0) ? 200 : 500), 
            res.json(this.ws.shards.map(x => x.status));
            res.end();
        }).listen(3001);

        require('appmetrics-dash').monitor({
            port: 8000, console: {
                log: logger.info,
                error: logger.error
            }
        });
    }
    
    public async start() {
        this.loadModules();
        
        await this._init();
        this.login(process.env.BTOKEN);
    }
}

interface BClientOptions {
    shardCount: string | number;
    presence: PresenceData,
    messageCacheLifetime: number;
    messageSweepInterval: number;
    messageCacheMaxSize: number;
}