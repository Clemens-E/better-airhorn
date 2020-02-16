import { Client, Message, MessageEmbed, Structures, TextChannel } from 'discord.js';
import { Config } from '../../configs/config';

export class BMessage extends Message {
    public commandFlags: string[];

    public constructor(client: Client, data: object, channel: TextChannel) {
        super(client, data, channel);
        this.commandFlags = [];
    }

    public error(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(Config.colors.error);
        return this.channel.send(embed);
    }
    public success(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(Config.colors.success);
        return this.channel.send(embed);
    }
    public warn(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(Config.colors.warn);
        return this.channel.send(embed);
    }
    public neutral(description: string, footer?: string): Promise<Message> {
        const embed = new MessageEmbed();
        if (description) embed.setDescription(description);
        if (footer) embed.setFooter(footer);
        embed.setColor(Config.colors.neutral);
        return this.channel.send(embed);
    }

}

Structures.extend('Message', (): any =>
    BMessage,
);
