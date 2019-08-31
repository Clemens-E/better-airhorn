import Sentry from '@sentry/node';
import MessageTaskList from 'discord-message-tasks';
import { Client, ClientOptions, Message, MessageEmbed, Structures, TextChannel } from 'discord.js';
import enmap from 'enmap';
import { Pool } from 'pg';

import { Config } from '../../configs/generalConfig';
import AudioStorage from '../classes/AudioStorage';
import Command from './command';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config.js');

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
        else console.warn('process is not running in production');
        this.dtl = new (require('discord-message-tasks'))(config.emojis.empty, config.emojis.done);
        this.once('ready', (): boolean => this.ready = true);
        this.settings = new enmap({ name: 'settings' });
        this.usage = new enmap({ name: 'usage' });
        this.messagesPerSecond = 0;
        this.taskList = new MessageTaskList(config.emojis.loading, config.emojis.done);
    }
}

export class BMessage extends Message {
    public flags: string[];

    public constructor(client: Client, data: object, channel: TextChannel) {
        super(client, data, channel);
        this.flags = [];
    }

    public error(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.error);
        return this.channel.send(embed);
    }
    public success(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.success);
        return this.channel.send(embed);
    }
    public warn(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.warn);
        return this.channel.send(embed);
    }
    public neutral(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.neutral);
        return this.channel.send(embed);
    }

}

Structures.extend('Message', (): any => {
    return BMessage;
});
