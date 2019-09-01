import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class Delete extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'delete',
            category: 'music',
            description: 'deletes an audio you own',

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
        if (!cmd) {
            return message.warn(`I can't find an audio named ${name}`, `did you mean "${
                await this.client.AudioStorage.similarity.bestMatch(name)}"?`);
        }
        if (cmd.user !== message.author.id) return message.error('You aren\'t allowed to delete Audios that you don\'t own');
        await this.client.AudioStorage.delete(cmd.filename);
        message.success(`deleted ${cmd.commandname}`);
    }
}

