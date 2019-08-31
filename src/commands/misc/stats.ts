import { MessageEmbed, version } from 'discord.js';
import moment from 'moment';
import fetch from 'node-fetch';
import os from 'os';

import { Config } from '../../../configs/generalConfig';
import { BClient, BMessage } from '../../models/client';
import Command from '../../models/command';

import('moment-duration-format');

export default class Stats extends Command {
    private readonly ticks = '```';

    public constructor(client: BClient) {
        super(client,
            {
                name: 'stats',
                category: 'misc',
                description: 'shows statistics about the bot',

                userPermissions: ['MANAGE_GUILD'],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: ['SEND_MESSAGES'],

                voiceChannel: false,
                voteLock: false,
            });
    }

    public async exec(client: BClient, message: BMessage): Promise<any> {
        const msg = message.neutral('fetching information');

        const uptime = moment.duration(client.uptime).format(' D [Days], H [Hours], m [Minutes], s [Seconds]');
        const shards = client.ws.shards.map(x => ({
            id: x.id,
            status: x.status,
        })).map(x =>
            `Shard ${x.id}: ${x.status === 0 ? client.config.emojis.online :
                [1, 2].includes(x.status) ? client.config.emojis.loading :
                    client.config.emojis.offline}`).join('\n');
        const usage = this.calculateUsage(client.usage);

        const embed = new MessageEmbed().setColor(client.config.colors.neutral)
            .addField('**> Bot User**', `${this.ticks}js
Uptime: ${uptime}
Current Shard: ${message.guild.shardID}
Total Shards: ${message.guild.shard.manager.shards.size}
Most used Command: '${usage.mostUsed.name}' with ${usage.mostUsed.usage} executions
Total Command Usage: ${usage.used}
Users: ${client.guilds.map(g => g.memberCount).reduce((a, b) => a + b).toLocaleString()}
Channels: ${client.channels.size.toLocaleString()}
Guilds: ${client.guilds.size.toLocaleString()}
Voice Connections: ${client.voice.connections.size}
Messages Per Second: ${client.messagesPerSecond.toFixed(1)}
${this.ticks}
        `)
            .addField('**> Host**', `
${this.ticks}js
CPU: ${os.cpus().length}x ${os.cpus()[0].model.replace(/ {2}/g, '')}
Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
Platform: ${os.platform}
${this.ticks}
`)
            .addField('**> Versions**', `
${this.ticks}js
Node.js: ${process.version}
Discord.js: ${version}
${this.ticks}
`)
            .addField('**> Shards**', shards)
            .addField('**> Other Services**', `
[Vote Server](${client.config.general.voteURL}): ${await this.checkStatus(client.config.general.voteURL, client.config)}`)
            .setFooter(`Developer & Owner: ${(await client.users.fetch(client.config.general.ownerID).catch(() => ({ tag: '' }))).tag}`);

        (await msg).edit(embed);
    }

    private async checkStatus(url: string, config: Config): Promise<string> {
        const status = (await fetch(url)).status;
        return (status < 300 && status >= 200 ? config.emojis.online : config.emojis.offline);
    }

    private calculateUsage(usage: any): { used: number; mostUsed: { name: string; usage: number } } {
        let commandsUsed = 0;
        const mostUsedCommand = {
            name: '',
            usage: 0,
        };

        usage.forEach((v: any, k: string) => {
            commandsUsed += v.usage.length;
            if (v.usage.length > mostUsedCommand.usage) {
                mostUsedCommand.name = k.toString();
                mostUsedCommand.usage = v.usage.length;
            }
        });
        return { used: commandsUsed, mostUsed: mostUsedCommand };
    }
}

