import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import os from 'os';
import { Command, CommandBase, Message } from 'shori';

@Command('stats', {
    channel: 'any',
    category: 'info',
    description: 'give information about the bot',
})
export class StatsCommand extends CommandBase {

    async exec(message: Message): Promise<any> {
        const memory = process.memoryUsage();
        const embed = new MessageEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL())
            .addField('System', stripIndents`\`\`\`asciidoc
                CPU: ${os.cpus()[0].model}
                RAM: ${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB
                ARCH: ${os.release()}
            \`\`\``)
            .addField('Bot', stripIndents`\`\`\`asciidoc
                Guilds: ${this.client.guilds.cache.size}
                Channels: ${this.client.channels.cache.size}
                Users: ${this.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}
            \`\`\``)
            .addField('Versions', stripIndents`\`\`\`asciidoc
                Node: ${process.version}
                D.JS: v${require('discord.js')?.version || 'unknown'}
                Shori: ${require('shori')?.version || 'unknown'}
            \`\`\``)
            .addField('Shards', stripIndents`\`\`\`asciidoc
                ${this.client.ws.shards.map(s => {
                    return `Shard ${s.id + 1}: ${s.status === 0 ? '✅' : '❌'}`;
                }).join('\n')}
            \`\`\``)
            .setFooter('Made by CHY4E#0505 and notavirus.exe#8093');

        return message.channel.send(embed);
    }

}
