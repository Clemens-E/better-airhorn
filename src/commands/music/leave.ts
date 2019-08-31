import { BClient, BMessage } from '../../models/client';
import Command from '../../models/command';

export default class Leave extends Command {

    public constructor(client: BClient) {
        super(client,
            {
                name: 'leave',
                category: 'music',
                description: 'leaves your voice channel, only use it when the bot is stuck in the channel',

                userPermissions: [],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: [],

                voiceChannel: false,
                voteLock: false,
            });
    }

    public async exec(client: BClient, message: BMessage, args: string[]): Promise<any> {
        if (message.member.voice && message.member.voice.channel) {
            message.member.voice.channel.leave();
            message.success('I left your voice channel');
        }
    }
}

