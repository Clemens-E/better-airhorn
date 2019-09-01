import { Message, MessageReaction, User, VoiceConnection } from 'discord.js';

import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class Play extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'play',
            category: 'music',
            example: 'play mayo',
            description: 'plays an audio file',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: ['CONNECT'],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: true,
            voteLock: false,
        });
    }

    private reject(msg: BMessage): Promise<Message> {
        return msg.error('Missing permissions to this Audio');
    }

    public async allowVoice(message: BMessage, args: string[]): Promise<boolean> {
        const cmd = await this.client.AudioStorage.fetch(args[0]);
        if (!cmd) {
            const similar = await this.client.AudioStorage.similarity.bestMatch(args[0]);
            message.warn(`I cant find an audio named ${args[0]}`, `did you mean "${similar}"?`);
        }
        return !!cmd;
    }

    public async exec(message: BMessage, args: string[], voice: VoiceConnection): Promise<any> {
        const { author, guild } = message;

        const cmd = await this.client.AudioStorage.fetch(args[0]);
        if (!cmd) {
            return message.warn(`I cant find an audio named ${args[0]}`, `did you mean "${
                await this.client.AudioStorage.similarity.bestMatch(args[0])}"?`);
        }


        switch (cmd.privacymode) {
            case 1:
                if (author.id !== cmd.user) return this.reject(message);
                break;
            case 2:
                if (author.id !== cmd.user && guild.id !== cmd.guild) return this.reject(message);
                break;
            case 3:
                break;
            default:
                throw new Error(`This should ** never ** happen, if this persists please report it in the support server.
            DEBUG INFO: Privacy Mode = ${ cmd.privacymode} `);
        }

        await this.client.AudioStorage.play(voice, cmd.commandname);
        voice.disconnect();
        const msg = await message.success(`finished playing \`${cmd.commandname}\``, 'react with 👍/👎 to upvote/downvote this audio');
        msg.createReactionCollector((r: MessageReaction, u: User): boolean => !u.bot && (r.emoji.name === '👍' || r.emoji.name === '👎'),
            { time: 20 * 1000 })

            .on('collect', (r: MessageReaction): void => {
                if (r.emoji.name === '👍') {
                    this.client.AudioStorage.upvote(r.users.last().id, cmd.commandname)
                        .then((): Promise<Message> => message.success(`👍 upvoted \`${cmd.commandname}\``))
                        .catch((): null => null);
                } else {
                    this.client.AudioStorage.downvote(r.users.last().id, cmd.commandname)
                        .then((): Promise<Message> => message.success(`👎 downvoted \`${cmd.commandname}\``))
                        .catch((): null => null);
                }
            })
            .on('end', (): Promise<Message> | null =>
                // We dont care for that error, only if we ever get rate limited for doing it.
                msg.reactions.removeAll().catch((): null => null)
            );

        await msg.react('👍');
        await msg.react('👎');
    }
}

