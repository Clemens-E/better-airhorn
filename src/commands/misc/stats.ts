import { stripIndents } from 'common-tags';
import { MessageEmbed, version } from 'discord.js';
import moment from 'moment';
import 'moment-duration-format';
import fetch from 'node-fetch';
import os from 'os';
import { Config } from '../../../configs/generalConfig';
import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';


export default class Stats extends Command {
    private readonly ticks = '```';

    public constructor(client: BClient) {
        super(client, {
            name: 'stats',
            category: 'misc',
            description: 'shows statistics about the bot',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: false,
            voteLock: false,
        });
    }

    public async exec(message: BMessage): Promise<any> {
        const msg = message.neutral('fetching information');
        const uptime = moment.duration(this.client.uptime).format(' D [Days], H [Hours], m [Minutes], s [Seconds]');
        const shards = this.client.ws.shards.map((x): { id: number; status: number } => ({
            id: x.id,
            status: x.status,
        })).map((x): string =>
            `Shard ${x.id}: ${x.status === 0 ? this.client.config.emojis.online :
                [1, 2].includes(x.status) ? this.client.config.emojis.loading :
                    this.client.config.emojis.offline}`).join('\n');
        const usage = this.calculateUsage();

        const embed = new MessageEmbed()
            .setColor(this.client.config.colors.neutral)
            .addField('**> Bot User**', stripIndents`${this.ticks}js
                Uptime: ${uptime}
                Current Shard: ${message.guild.shardID}
                Total Shards: ${message.guild.shard.manager.shards.size}
                Most used Command: '${usage.mostUsed.name}' with ${usage.mostUsed.usage} executions
                Total Command Usage: ${usage.used}
                Users: ${this.client.guilds.map((g): number => g.memberCount).reduce((a, b): number => a + b).toLocaleString()}
                Channels: ${this.client.channels.size.toLocaleString()}
                Guilds: ${this.client.guilds.size.toLocaleString()}
                Voice Connections: ${this.client.voice.connections.size}
                Messages Per Second: ${this.client.messagesPerSecond.toFixed(1)}
                ${this.ticks}`)
            .addField('**> Host**', stripIndents`
                ${this.ticks}js
                CPU: ${os.cpus().length}x ${os.cpus()[0].model.replace(/ {2}/g, '')}
                Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
                Platform: ${os.platform}
                ${this.ticks}
            `)
            .addField('**> Versions**', stripIndents`
                ${this.ticks}js
                Node.js: ${process.version}
                Discord.js: ${version}
                ${this.ticks}
            `)
            .addField('**> Shards**', shards)
            .addField('**> Other Services**', stripIndents`
                [Vote Server](${this.client.config.general.voteURL}): ${await this.checkStatus(this.client.config.general.voteURL, this.client.config)}
                [Status Page & Planned Downtimes](${this.client.config.general.statusPage})`)
            .setFooter(
                `Developer & Owner: ${(await this.client.users.fetch(this.client.config.general.ownerID).catch((): { tag: string } => ({ tag: '' }))).tag}`);

        (await msg).edit(embed);
    }

    private async checkStatus(url: string, config: Config): Promise<string> {
        const status = (await fetch(url)).status;
        return (status < 300 && status >= 200 ? config.emojis.online : config.emojis.offline);
    }

    private calculateUsage(): { used: number; mostUsed: { name: string; usage: number } } {
        let commandsUsed = 0;
        const mostUsedCommand = {
            name: '',
            usage: 0,
        };

        this.client.usage.forEach((v: any, k: string): void => {
            commandsUsed += v.usage.length;

            if (v.usage.length > mostUsedCommand.usage) {
                mostUsedCommand.name = k.toString();
                mostUsedCommand.usage = v.usage.length;
            }
        });

        return { used: commandsUsed, mostUsed: mostUsedCommand };
    }
}

