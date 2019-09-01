import { MessageEmbed, MessageReaction } from 'discord.js';

import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class Help extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'help',
            category: 'misc',
            description: 'shows this help page',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: false,
            voteLock: false,
        });
    }

    public async exec(message: BMessage, args: string[]): Promise<any> {
        const arg = args[0];
        if (this.isCommand(this.client.commands, arg)) {
            const cmd = this.client.commands.get(arg);
            message.channel.send(this.showCommandHelp(cmd));
        } else if (this.isCategory(arg)) {
            message.channel.send(this.showCategoryHelp(arg));
        } else {
            const categories = this.getCategories();
            let index = 0;
            const msg = await message.channel.send(this.showCategoryHelp(categories[index]));
            message.createReactionCollector((r: any, u: any): boolean => u.id === message.id && (r.emoji.name === '▶' || r.emoji.name === '◀'), { time: 60 * 1000 * 2 })
                .on('collect', (r: MessageReaction): void => {
                    if (r.emoji.name === '▶') {
                        index++;

                    }
                });
        }
    }

    private showCommandHelp(cmd: Command): MessageEmbed {
        return new MessageEmbed()
            .setTitle(`Help for ${cmd.name}`)
            .setColor(this.client.config.colors.neutral)
            .setDescription(
                `Name:          ${cmd.name}
 Description:   ${cmd.description}
 Example:      \`${cmd.example || 'none'}\`
 Category:      ${cmd.category}
 Voice Command: ${cmd.voteLock ? 'Yes' : 'No'}
 Vote locked:   ${cmd.voteLock ? 'Yes' : 'No'}`
            );
    }

    private getCategories(): string[] {
        return [... new Set(Array.from(this.client.commands, ([, value]): string => value.category))];
    }

    private showCategoryHelp(category: string): MessageEmbed {
        const cate = Array.from(this.client.commands, ([, value]): Command => value);
        return new MessageEmbed()
            .setTitle(`Help for ${category}`)
            .setColor(this.client.config.colors.neutral)
            .setDescription(cate.map((cmd): string => `
**${cmd.name}**                
Name:          ${cmd.name}
Description:   ${cmd.description}
Example:      \`${cmd.example || 'none'}\`
Category:      ${cmd.category}
Voice Command: ${cmd.voteLock ? 'Yes' : 'No'}
Vote locked:   ${cmd.voteLock ? 'Yes' : 'No'}`
            ).join('\n\n'));
    }

    private isCommand(commands: Map<string, Command>, name: string): boolean {
        return Array.from(commands, ([, value]): string => value.name).includes(name);
    }

    private isCategory(name: any): boolean {
        return this.getCategories().includes(name);
    }
}

