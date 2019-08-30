import { Message, VoiceConnection } from 'discord.js';

import { BClient, BMessage } from '../../models/client';
import Command from '../../models/command';

export default class Play extends Command {

    public constructor(client: BClient) {
        super(client,
            {
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

    public async exec(client: BClient, message: BMessage, args: string[], voice: VoiceConnection): Promise<any> {
        const { author, guild } = message;

        const cmd = await client.AudioStorage.fetchAudio(args[0]);
        if (!cmd) {
            const similar = await client.AudioStorage.similarity.bestMatch(args[0]);
            return message.warn(`I cant find a audio named ${args[0]}`, `did you mean "${similar}"?`);
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

        await client.AudioStorage.play(voice, cmd.commandname);
        voice.disconnect();
        const msg = await message.success(`finished playing \`${cmd.commandname}\``, 'react with 👍/👎 to upvote/downvote this audio');
        msg.createReactionCollector((r, u) => !u.bot && (r.emoji.name === '👍' || r.emoji.name === '👎'),
            { time: 20 * 1000 })

            .on('collect', (r) => {
                if (r.emoji.name === '👍') {
                    client.AudioStorage.upvote(r.users.last().id, cmd.commandname)
                        .then(() => message.success(`👍 upvoted \`${cmd.commandname}\``))
                        .catch(() => null);
                } else {
                    client.AudioStorage.downvote(r.users.last().id, cmd.commandname)
                        .then(() => message.success(`👎 downvoted \`${cmd.commandname}\``))
                        .catch(() => null);
                }
            })
            .on('end', () =>
                msg.reactions.removeAll().catch(() => null)
            );

        await msg.react('👍');
        await msg.react('👎');
    }
}

