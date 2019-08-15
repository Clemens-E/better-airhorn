import { VoiceConnection } from 'discord.js';

import { BClient, BMessage } from '../../struct/client';
import Command from '../../struct/command';

export default class Eval extends Command {
    private readonly denyMessage = `Missing permissions to this Audio`;

    constructor(client: BClient) {
        super(client,
            {
                name: 'invite',
                category: 'misc',
                example: 'invite',
                description: 'sends you an invite to invite this bot!',

                userPermissions: [],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: ['SEND_MESSAGES'],

                voiceChannel: false,
                voteLock: false,
            });
    }

    async exec(client: BClient, message: BMessage, args: string[], voice?: VoiceConnection): Promise<any> {
        message.neutral(`Invite me with [this link](${await client.generateInvite(36703232)} 'Invite me!')`, 'Thank you for inviting me!');
    }
}

