import {Message, MessageReaction, User, VoiceConnection} from 'discord.js';
import {BClient} from '../../client/Client';
import {Command} from '../../structures/Command';
import {BMessage} from '../../structures/Message';


export default class Play extends Command {

    public constructor(client: BClient) {
        super(client, {
            name: 'play',
            category: 'music',
            example: 'play mayo',
            description: 'plays an audio file',

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: ['CONNECT'],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: true,
            voteLock: false,
        });
    }

    private reject(msg: BMessage): Promise<Message> {
        return msg.error('Missing permissions to this Audio');
    }

    public async allowVoice(message: BMessage, args: string[]): Promise<boolean> {
        if (args.length < 1) {
            message.warn('please supply an argument', 'example: "play letsgo"');
            return false;
        }

        const cmd = await this.client.AudioStorage.fetch(args[0]);
        if (!cmd) {
            message.warn(`I cant find an audio named ${args[0]}`, `did you mean "${
                await this.client.AudioStorage.similarity.bestMatch(args[0])
                }"?`);
        }

        return !!cmd;
    }

    public async exec(message: BMessage, args: string[], voice: VoiceConnection): Promise<any> {
        const { author, guild } = message;

        const cmd = await this.client.AudioStorage.fetch(args[0]);
        if (!cmd) {
            return message.warn(`I cant find an audio named ${args[0]}`, `did you mean "${
                await this.client.AudioStorage.similarity.bestMatch(args[0])}"?`);
        }
        if (message.deletable) message.delete().catch((): null => null);

        switch (cmd.privacymode) {
            case 1:
                if (author.id !== cmd.user) return this.reject(message);
                break;
            case 2:
                if (author.id !== cmd.user && guild.id !== cmd.guild) return this.reject(message);
                break;
            case 3:
                break;
            default:
                throw new Error(`This should ** never ** happen, if this persists please report it in the support server.
                DEBUG INFO: Privacy Mode = ${cmd.privacymode} `);
        }

        await this.client.AudioStorage.play(voice, cmd.commandname);
        voice.disconnect();

        const msg = await message.success(`finished playing \`${cmd.commandname}\``, 'react with 👍/👎 to upvote/downvote this audio');
        msg.createReactionCollector((r: MessageReaction, u: User): boolean => !u.bot && (r.emoji.name === '👍' || r.emoji.name === '👎'),
            { time: 20 * 1000 })
            .on('collect', (r: MessageReaction): void => {
                if (r.emoji.name === '👍') {
                    this.client.AudioStorage.upvote(r.users.last().id, cmd.commandname)
                        .then((): Promise<Message> => message.success(`👍 upvoted \`${cmd.commandname}\``))
                        .then(m => m.delete({ timeout: 5 * 1000 }).catch((): null => null))
                        .catch((): null => null);
                } else {
                    this.client.AudioStorage.downvote(r.users.last().id, cmd.commandname)
                        .then((): Promise<Message> => message.success(`👎 downvoted \`${cmd.commandname}\``)
                            .then(m => m.delete({ timeout: 5 * 1000 }).catch((): null => null)))
                        .catch((): null => null);
                }
            })
            .on('end', (): Promise<Message> | null =>
                msg.delete().catch((): null => null),
            );

        await msg.react('👍').then(() =>
            msg.react('👎'),
        ).catch((): null => null);
    }
}

