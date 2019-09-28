import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';

export default class Delete extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'delete',
            category: 'music',
            description: 'deletes a clip you own',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: false,
            voteLock: false,
        });
    }

    public async exec(message: BMessage, args: string[]): Promise<any> {
        const name = args[0];
        const cmd = await this.client.AudioStorage.fetch(name);

        if (!cmd) return message.warn(`I can't find a clip named ${name}`, `did you mean "${await this.client.AudioStorage.similarity.bestMatch(name)}"?`);
        if (cmd.user !== message.author.id) return message.error('You aren\'t allowed to delete clips that you don\'t own');

        await this.client.AudioStorage.delete(cmd.filename);
        return message.success(`deleted ${cmd.commandname}`);
    }
}

