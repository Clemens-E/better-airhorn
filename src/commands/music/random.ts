import { Message, MessageReaction, User, VoiceConnection } from 'discord.js';
import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';


export default class Random extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'random',
            category: 'music',
            example: 'random',
            description: 'plays a random audio file',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: ['CONNECT'],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: true,
            voteLock: false,
        });
    }

    public async exec(message: BMessage, _args: string[], voice: VoiceConnection): Promise<any> {
        const cmd = await this.client.AudioStorage.random().catch((): null =>null);
        if (!cmd) return message.warn('I did not find any Audio that is suitable.');

        await this.client.AudioStorage.play(voice, cmd.commandname);
        voice.disconnect();

        const msg = await message.success(`finished playing \`${cmd.commandname}\``, 'react with 👍/👎 to upvote/downvote this audio');
        msg.createReactionCollector((r: MessageReaction, u: User): boolean => !u.bot && (r.emoji.name === '👍' || r.emoji.name === '👎'),
            { time: 20 * 1000 })
            .on('collect', (r: MessageReaction): void => {
                if (r.emoji.name === '👍') {
                    this.client.AudioStorage.upvote(r.users.last().id, cmd.commandname)
                        .then((): Promise<Message> => message.success(`👍 upvoted \`${cmd.commandname}\``))
                        .then(m => m.delete({ timeout: 5 * 1000 }).catch((): null => null))
                        .catch((): null => null);
                } else {
                    this.client.AudioStorage.downvote(r.users.last().id, cmd.commandname)
                        .then((): Promise<Message> => message.success(`👎 downvoted \`${cmd.commandname}\``)
                            .then(m => m.delete({ timeout: 5 * 1000 }).catch((): null => null)))
                        .catch((): null => null);
                }
            })
            .on('end', (): Promise<Message> | null =>
                msg.delete().catch((): null => null),
            );

        msg.react('👍').then(() =>
            msg.react('👎'),
        ).catch((): null => null);
    }
}

