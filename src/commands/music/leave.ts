import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';

export default class Leave extends Command {

    public constructor(client: BClient) {
        super(client, {
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

    public async exec(message: BMessage): Promise<any> {
        if (message.member.voice && message.member.voice.channel) {
            message.member.voice.channel.leave();
            message.success('I left your voice channel');
        }
    }
}

