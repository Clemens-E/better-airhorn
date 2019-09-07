import * as Sentry from '@sentry/node';
import MessageTaskList from 'discord-message-tasks';
import { Client, ClientOptions } from 'discord.js';
import enmap from 'enmap';
import { Pool } from 'pg';

import { Config } from '../../configs/generalConfig';
import AudioStorage from '../classes/AudioStorage';
import { logger } from '../classes/Logger';
import Command from './Command';

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
}

