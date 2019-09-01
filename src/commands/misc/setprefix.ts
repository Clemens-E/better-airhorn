import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class SetPrefix extends Command {
    private readonly denyMessage = 'Missing permissions to this Audio';

    public constructor(client: BClient) {
        super(client, {
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

    public async exec(message: BMessage, args: string[]): Promise<any> {
        const prefix = args.join(' ');
        if (prefix.length > 10) return message.warn(`Your desired prefix is ${prefix.length} characters long`, 'Prefixes can\'t be longer than 10 characters');
        this.client.settings.set(message.guild.id, prefix, 'prefix');
        message.success('Successfully updated your prefix!', `Your new prefix is ${prefix}`);
    }
}

