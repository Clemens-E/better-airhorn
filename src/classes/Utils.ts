import { Channel, CollectorFilter, Message, MessageEmbed, TextChannel, MessageReaction, ReactionEmoji, User, MessageAttachment } from 'discord.js';

import { BClient } from '../models/Client';
import { BMessage } from '../models/Message';

interface ConfirmationCallback {
    (m: Message, value: string): Promise<boolean>;
}

export default class Utils {
    public static readonly ticks = '```';

    static promptMessage(message: Message, channel: Channel, time: number, filter: CollectorFilter, cb: ConfirmationCallback): Promise<string> {
        let variable: string;
        return new Promise((res, rej): void => {
            const collector = (channel as TextChannel).createMessageCollector(filter, { time });
            collector
                .on('collect', async (m: BMessage) => {
                    if (m.content === '/cancel') return collector.stop();
                    variable = m.content;

                    if (!await cb(m, variable)) {
                        variable = undefined;
                        return;
                    }
                    if (variable) collector.stop();
                })
                .on('end', async () => {
                    if (!variable) {
                        rej(new Error('no variable in time provided or cancelled'));
                    }
                    res(variable);
                });
        });
    }

    static async promptName(client: BClient, message: BMessage, messages: Message[]): Promise<string> {
        const msg = await message.neutral('what should the name of the clip be?', '/cancel if you want to abort the command');

        messages.push(msg);
        return Utils.promptMessage(msg, msg.channel, 30 * 1000 * 60,
            (m: Message): boolean => m.author.id === message.author.id,
            async (m: BMessage, value: string): Promise<boolean> => {
                messages.push(m);
                if (value.includes(' ')) {
                    messages.push(await m.warn('spaces in names are not allowed', 'please send another name'));
                    return false;
                }
                if (value.length > 10) {
                    messages.push(await message.warn('names can\'t be longer than 10 characters', 'please send another name'));
                    return false;
                }
                if (await client.AudioStorage.nameExists(value)) {
                    messages.push(await message.warn(`\`${value}\` is already in use`, 'please send another name'));
                    return false;
                }
                return true;
            });
    }

    static async promptPrivacyMode(client: BClient, message: BMessage, messages: Message[]): Promise<string> {
        const replys = client.AudioStorage.privacyOptions;
        const infoMsg = `
**Options:**
${this.ticks}asciidoc
[${replys[0]}]
I will send you the clip and delete it from my FileSystem.
${this.ticks}
${this.ticks}asciidoc
[${replys[1]}]
Only you are able to play this clip. By choosing this, you allow me to save the record on my FileSystem
${this.ticks}
${this.ticks}asciidoc
[${replys[2]}]
Only people in this Guild will be able to play it. You can play it everywhere else. By choosing this, you allow me to save the record on my FileSystem
${this.ticks}
${this.ticks}asciidoc
[${replys[3]}]
!!Everyone!! (REALLY EVERYONE) will be able to play this. By choosing this, you allow me to save the record on my FileSystem
${this.ticks}`;
        const msg = await message.channel.send(
            new MessageEmbed()
                .setTitle('What am I supposed to do with the recorded file?')
                .setDescription(infoMsg),
        );

        messages.push(msg);
        return Utils.promptMessage(msg, msg.channel, 30 * 1000 * 60,
            (m: Message): boolean => m.author.id === message.author.id,
            async (m: BMessage): Promise<boolean> => {
                messages.push(m);
                if (!replys.includes(m.content)) {
                    messages.push(await message.channel.send(`Please send a valid mode: \`${replys.join('` or `')}\``));
                    return false;
                }
                return true;
            });
    }

    static async checkDownload(client: BClient, message: BMessage): Promise<void> {
        if (
            (message.channel as TextChannel).permissionsFor(message.guild.me).missing(['ADD_REACTIONS', 'SEND_MESSAGES', 'USE_EXTERNAL_EMOJIS']).length
            > 0) return;

        const attachment = message.attachments.find(x =>
            ['.mp3', '.m4a', '.ogg', '.wav'].includes(x.name.slice(-4)) && x.size < client.config.audio.maxFileSize);

        if (!attachment) return;

        const reaction: MessageReaction = await message.react(client.config.emojis.import).catch(() => null);
        if (!reaction) return;
        const collector = message.createReactionCollector(
            (r: ReactionEmoji, u: User) => u.id === message.author.id,
            { time: 1000 * 30 }
        )
            .on('collect', async () => {
                collector.stop();
                const messagesToDelete: Message[] = [];
                const msg = await message.neutral(`${client.config.emojis.loading} please wait while I download and convert your file`);
                const fileName = await client.AudioStorage.download(message.attachments.first().url).catch(() => null);
                if (!fileName) return message.error('something went wrong while downloading or converting', 'make sure it\'s a valid audiofile');

                // checks duration of the file
                const duration = await client.AudioStorage.duration(fileName);
                if (duration < 1) {
                    msg.delete();
                    return message.warn('are you sure your file was a valid audio file?', 'I wasn\'t able to get its duration..');
                }
                if (duration > (60 * 5)) {
                    msg.delete();
                    return message.warn('your file seems to be longer than 5 minutes, please upload something shorter');
                }

                msg.delete();
                const pM = client.AudioStorage.encodePrivacyMode(await Utils.promptPrivacyMode(client, message, messagesToDelete).catch((): null => null));
                if (pM === undefined) {
                    await client.AudioStorage.delete(fileName, true);
                    return;
                }

                const name = await Utils.promptName(client, message, messagesToDelete).catch((): null => null);
                if (!name) {
                    await client.AudioStorage.delete(fileName, true); return;
                }

                client.AudioStorage.add({
                    commandname: name,
                    privacymode: (pM as (0 | 1 | 2 | 3)), guild: message.guild.id, user: message.author.id,
                    filename: fileName,
                });

                if (pM === 0) {
                    await message.author.send(new MessageAttachment(`${client.config.audio.storage}/${fileName}`));
                    await client.AudioStorage.delete(fileName, true);
                }
                await message.success('I finished converting', `use "${client.settings.get(message.guild.id).prefix}play ${name}"`);
                message.channel.bulkDelete(messagesToDelete).catch(() => null);
            })
            .on('end', () => {
                reaction.users.remove(client.user)
                    .catch(() => null);
            });
    }
}