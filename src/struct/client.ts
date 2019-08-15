import { Client, ClientOptions, Structures, TextChannel, MessageEmbed, Collection, Message } from 'discord.js';
import { Config } from '../../configs/generalConfig';
import { Pool } from 'pg';
import Command from './command';
import enmap from 'enmap';
import Sentry from '@sentry/node';
import AudioStorage from '../classes/AudioStorage';

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

    constructor(opts: ClientOptions) {
        super(opts);
        this.pg = new Pool({
            connectionString: process.env.PSQL,
        });
        this.AudioStorage = new AudioStorage(this.pg, config.audio.storage, config.audio.maxFolderSize, 60 * 1000);
        this.commands = new Map<string, Command>();
        this.config = config;
        this.sentry = Sentry;
        this.ready = false;
        if (process.env.NODE_ENV === 'production') this.sentry.init({ dsn: process.env.SENTRYURL });
        else console.warn('process is not running in production');
        this.dtl = new (require('discord-message-tasks'))(config.emojis.empty, config.emojis.done);
        this.once('ready', () => this.ready = true);
        this.settings = new enmap({ name: 'settings' });
        this.usage = new enmap({ name: 'usage' });
        this.messagesPerSecond = 0;
    }
}

export class BMessage extends Message {
    public flags: string[];

    constructor(client: Client, data: object, channel: TextChannel) {
        super(client, data, channel);
        this.flags = [];
    }

    public error(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.error);
        this.channel.send(embed);
    }
    public success(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.success);
        this.channel.send(embed);
    }
    public warn(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.warn);
        this.channel.send(embed);
    }
    public neutral(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.neutral);
        this.channel.send(embed);
    }

}

Structures.extend('Message', (Message) => {
    return BMessage;
});
