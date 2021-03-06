import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';

export default class Invite extends Command {

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

