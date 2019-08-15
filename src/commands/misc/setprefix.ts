import { VoiceConnection } from 'discord.js';

import { BClient, BMessage } from '../../struct/client';
import Command from '../../struct/command';

export default class Eval extends Command {
    private readonly denyMessage = `Missing permissions to this Audio`;

    constructor(client: BClient) {
        super(client,
            {
                name: 'setprefix',
                category: 'misc',
                example: 'setprefix 4',
                description: 'sets the prefix for this Guild',

                userPermissions: ['MANAGE_GUILD'],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: ['SEND_MESSAGES'],

                voiceChannel: false,
                voteLock: false,
            });
    }

    async exec(client: BClient, message: BMessage, args: string[], voice?: VoiceConnection): Promise<any> {
        const prefix = args.join(' ');
        if (prefix.length > 10) return message.warn(`Your desired prefix is ${prefix.length} characters long`, 'Prefixes can\'t be longer than 10 characters');
        client.settings.set(message.guild.id, prefix, 'prefix');
        message.success('Successfully updated your prefix!', `Your new prefix is ${prefix}`);
    }
}

