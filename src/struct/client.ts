import { Client, ClientOptions, Structures, TextChannel, MessageEmbed, Collection, Message } from 'discord.js';
import { Config } from '../../configs/generalConfig';
import Command from './command';
import enmap from 'enmap';
import Sentry from '@sentry/node';

const config: Config = require('../../configs/config.js');

export class BClient extends Client {
    public config: Config;
    public sentry: any;
    public dtl: any;
    public commands: Map<string, Command>;
    public ready: boolean;
    public settings: enmap;
    public usage: enmap;

    constructor(opts: ClientOptions) {
        super(opts);
        this.commands = new Map<string, Command>();
        this.config = config;
        this.sentry = Sentry;
        this.ready = false;
        if (!process.env.PROD) this.sentry.init({ dsn: process.env.SENTRYURL });
        else console.warn('process is not running in production');
        this.dtl = new (require('discord-message-tasks'))(config.emojis.empty, config.emojis.done);
        this.once('ready', () => this.ready = true);
        this.settings = new enmap({ name: 'settings' });
        this.usage = new enmap({ name: 'usage' });
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
    }
    public success(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.success);
    }
    public warn(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.warn);
    }
    public neutral(description: string, footer?: string) {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(config.colors.neutral);
    }

}

Structures.extend('Message', (Message) => {
    return BMessage;
});
