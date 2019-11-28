import { stripIndents } from 'common-tags';
import { MessageEmbed, MessageReaction, User } from 'discord.js';
import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';


export default class Help extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'help',
            category: 'misc',
            description: 'shows this help page',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES',  'ADD_REACTIONS'],

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

            const inc = (): void => {
                if (index >= categories.length - 1) {
                    index = 0;
                    return;
                }
                index++;
            };

            const dec = (): void => {
                if (index <= 0) {
                    index = categories.length;
                    return;
                }
                index--;
            };

            const msg = await message.channel.send(this.showCategoryHelp(categories[index]));
            msg.createReactionCollector((r: MessageReaction, u: User): boolean => u.id === message.author.id && (r.emoji.name === '▶' || r.emoji.name === '◀'), { time: 60 * 1000 * 2 })
                .on('collect', (r: MessageReaction): void => {
                    if (r.emoji.name === '▶') inc();
                    else dec();

                    r.users.remove(r.users.last()).catch(() => null);
                    msg.edit(this.showCategoryHelp(categories[index]));
            });

            await msg.react('◀');
            await msg.react('▶');
        }
    }

    private showCommandHelp(cmd: Command): MessageEmbed {
        return new MessageEmbed()
            .setTitle(`Help for ${cmd.name}`)
            .setColor(this.client.config.colors.neutral)
            .setDescription(stripIndents`
                Name:          ${cmd.name}
                Description:   ${cmd.description}
                Example:      \`${cmd.example || 'none'}\`
                Category:      ${cmd.category}
                Voice Command: ${cmd.voiceChannel ? 'Yes' : 'No'}
                Vote locked:   ${cmd.voteLock ? 'Yes' : 'No'}
            `);
    }

    private getCategories(): string[] {
        return [...new Set(Array.from(this.client.commands, ([, value]): string => value.category))].reverse();
    }

    private showCategoryHelp(category: string): MessageEmbed {
        const cate = Array.from(this.client.commands, ([, value]): Command => value).filter(x => x.category === category);
        return new MessageEmbed()
            .setTitle(`Help for ${category}`)
            .setColor(this.client.config.colors.neutral)
            .setDescription(cate.map((cmd): string => stripIndents`
                **${cmd.name}**
                Name:          ${cmd.name}
                Description:   ${cmd.description}
                Example:      \`${cmd.example || 'none'}\`
                Category:      ${cmd.category}
                Voice Command: ${cmd.voteLock ? 'Yes' : 'No'}
                Vote locked:   ${cmd.voteLock ? 'Yes' : 'No'}`,
            ).join('\n\n'));
    }

    private isCommand(commands: Map<string, Command>, name: string): boolean {
        return Array.from(commands, ([, value]): string => value.name).includes(name);
    }

    private isCategory(name: string): boolean {
        return this.getCategories().includes(name);
    }
}

