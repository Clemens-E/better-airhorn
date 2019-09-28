import { Message, Client, TextChannel, MessageEmbed, Structures } from 'discord.js';
import { Config } from '../../configs/generalConfig';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config');

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
