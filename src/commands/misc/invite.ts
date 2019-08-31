import { BClient, BMessage } from '../../models/client';
import Command from '../../models/command';

export default class Invite extends Command {
    private readonly denyMessage = 'Missing permissions to this Audio';

    public constructor(client: BClient) {
        super(client,
            {
                name: 'invite',
                category: 'misc',
                example: 'invite',
                description: 'sends you an invite for this bot',

                userPermissions: [],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: ['SEND_MESSAGES'],

                voiceChannel: false,
                voteLock: false,
            });
    }

    public async exec(client: BClient, message: BMessage): Promise<any> {
        return message.neutral(`Invite me with [this link](${await client.generateInvite(36703232)} 'Invite me!')`, 'Thank you for inviting me!');
    }
}

