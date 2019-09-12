import { AudioCommand } from '../../models/AudioCommand';
import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';

export default class List extends Command {
    private readonly denyMessage = 'Missing permissions to this Audio';

    public constructor(client: BClient) {
        super(client, {
            name: 'list',
            category: 'music',
            description: 'lists different audios, sorted by upvotes',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: false,
            voteLock: false,
        });
    }

    public async exec(message: BMessage, args: string[]): Promise<any> {
        let audios: AudioCommand[];

        if (args.length === 0 || args[0] === 'all') audios = await this.client.AudioStorage.fetchAll({ includeVotes: true, global: true });
        else if (args[0] === 'mine') audios = await this.client.AudioStorage.fetchAll({ includeVotes: true, user: message.author.id });
        else audios = await this.client.AudioStorage.fetchAll({ includeVotes: true, guild: message.guild.id });

        if (audios.length === 0) return message.warn('I couldn\'t find anything');
        this.sortByVotes(audios);
        audios.splice(10);
        const longestName = audios.map(x => x.commandname).reduce((long, str) => Math.max(long, str.length), 0);
        const longestVote = audios.map(x => (x.upvotes - x.downvotes).toLocaleString()).reduce((long, str) => Math.max(long, str.length), 0);
        message.neutral(
            '```css\n' +
            audios.map((x: AudioCommand) =>
                `${x.commandname}${' '.repeat(longestName - x.commandname.length)} : [${x.upvotes - x.downvotes}]${
                ' '.repeat(longestVote - (x.upvotes - x.downvotes).toLocaleString().length)}`).join('\n')
            + '```',
            'this is limited to 10 entry\'s'
        );
    }

    private sortByVotes(audios: AudioCommand[]): void {
        audios.sort((a, b): number =>
            (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        );
    }
}

