import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class ClearMem extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'mem',
            category: 'owner',
            description: 'sweeps users, members and messages',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: false,
            voteLock: false,
        });
    }

    public async exec(message: BMessage, args: string[]): Promise<any> {
        const { channel, author } = message;
        const cmd = await this.client.AudioStorage.fetch(args[0]);
        if (!cmd) return channel.send(`can't find a Audio Clip named ${args[0]}`);
        if (cmd.user !== author.id) return channel.send('You can only delete AudioClips you created.');
        await this.client.AudioStorage.delete(cmd.filename);
        channel.send(`Done. FileName: \`${cmd.filename}\`\nCommandName: \`${cmd.commandname}\``);
    }

}

