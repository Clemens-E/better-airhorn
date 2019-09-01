import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class Invite extends Command {
    private readonly denyMessage = 'Missing permissions to this Audio';

    public constructor(client: BClient) {
        super(client, {
            name: 'invite',
            category: 'misc',
            description: 'sends you an invite for this bot',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: false,
            voteLock: false,
        });
    }

    public async exec(message: BMessage): Promise<any> {
        return message.neutral(`Invite me with [this link](${await this.client.generateInvite(36703232)} 'Invite me!')`, 'Thank you for inviting me!');
    }
}

