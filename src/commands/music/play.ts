import { VoiceConnection, ReactionEmoji } from 'discord.js';

import { BClient, BMessage } from '../../models/client';
import Command from '../../models/command';

export default class Play extends Command {
    private readonly denyMessage = 'Missing permissions to this Audio';

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

    public async exec(client: BClient, message: BMessage, args: string[], voice: VoiceConnection): Promise<any> {
        const { author, guild } = message;

        const cmd = await client.AudioStorage.fetchAudio(args[0]);
        if (!cmd) return message.error('I can\'t find such audio');

        switch (cmd.privacymode) {
            case 1:
                if (author.id !== cmd.user) return message.warn(this.denyMessage);
                break;
            case 2:
                if (author.id !== cmd.user && guild.id !== cmd.guild) return message.warn(this.denyMessage);
                break;
            case 3:
                break;
            default:
                throw new Error(`This should **never** happen, if this persists please report it in the support server.
    DEBUG INFO: Privacy Mode=${cmd.privacymode}`);
        }
        await client.AudioStorage.play(voice, cmd.commandname);
        voice.disconnect();
        const msg = await message.success(`finished playing \`${cmd.commandname}\``, 'react with 👍/👎 to upvote/downvote this audio');
        msg.createReactionCollector((r, u) => !u.bot && (r.emoji.name === '👍' || r.emoji.name === '👎'),
            { time: 20 * 1000 })

            .on('end', () =>
                msg.reactions.removeAll()
            )
            .on('collect', (r) => {
                if (r.emoji.name === '👍') {
                    client.AudioStorage.upvote(r.users.last().id, cmd.commandname)
                        .then(() => message.success(`upvoted \`${cmd.commandname}\` 👍`))
                        .catch(() => null);
                } else {
                    client.AudioStorage.downvote(r.users.last().id, cmd.commandname)
                        .then(() => message.success(`downvoted \`${cmd.commandname}\` 👎`))
                        .catch(() => null);
                }
            });
        await msg.react('👍');
        await msg.react('👎');


        // TODO: add vote system
        /*
        👍 upvote audio
        👎 downvote audio
        ⚠ report audio
        add a small info in the footer
        */
    }
}

