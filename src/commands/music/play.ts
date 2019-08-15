import { VoiceConnection } from 'discord.js';

import { BClient, BMessage } from '../../struct/client';
import Command from '../../struct/command';

export default class Eval extends Command {
    private readonly denyMessage = `Missing permissions to this Audio`;

    constructor(client: BClient) {
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

    async exec(client: BClient, message: BMessage, args: string[], voice: VoiceConnection): Promise<any> {
        const { author, guild } = message;

        const cmd = await client.AudioStorage.fetchAudio(args[0]);
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
        await client.AudioStorage.playAudio(voice, cmd.commandname);
        message.success(`finished playing \`${cmd.commandname}\``);
        voice.disconnect();

        // TODO: add vote system
        /*
        👍 upvote audio
        👎 downvote audio
        ⚠ report audio
        add a small info in the footer
        */
    }
}

