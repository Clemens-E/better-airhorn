import { Message, MessageAttachment, MessageEmbed, VoiceConnection } from 'discord.js';

import Utils from '../../classes/Utils';
import { BClient } from '../../models/Client';
import Command from '../../models/Command';
import { BMessage } from '../../models/Message';
import fs from 'fs';

export default class Record extends Command {
    private ticks = '```';
    private replys: string[];
    private readonly infoMsg: string;
    public constructor(client: BClient) {
        super(client, {
            name: 'recordme',
            category: 'music',
            description: `records you for maximal ${client.config.audio.maxRecordTime} Seconds`,

            userPermissions: [],
            userChannelPermissions: [],

            botPermissions: [],
            botChannelPermissions: ['SEND_MESSAGES'],

            voiceChannel: true,
            voteLock: true,
        });
        this.replys = this.client.AudioStorage.privacyOptions;
        this.infoMsg = `
**Options:**
${this.ticks}asciidoc
[${this.replys[0]}]
I will send you the clip and delete it from my FileSystem.
${this.ticks}
${this.ticks}asciidoc
[${this.replys[1]}]
Only you are able to play this clip. By choosing this, you allow me to save the record on my FileSystem
${this.ticks}
${this.ticks}asciidoc
[${this.replys[2]}]
Only people in this Guild will be able to play it. You can play it everywhere else. By choosing this, you allow me to save the record on my FileSystem
${this.ticks}
${this.ticks}asciidoc
[${this.replys[3]}]
!!Everyone!! (REALLY EVERYONE) will be able to play this. By choosing this, you allow me to save the record on my FileSystem
${this.ticks}`;
    }


    public async exec(message: BMessage, args: string[], voice: VoiceConnection): Promise<any> {
        const messages: Message[] = [];
        const parsed = (parseInt(args[0], 10) * 1000) || (this.client.config.audio.maxRecordTime * 1000) / 2;
        const timeout = parsed > this.client.config.audio.maxRecordTime * 1000 ? this.client.config.audio.maxRecordTime * 1000 : parsed;
        message.success(`I will record ${message.author} for ${timeout / 1000} Seconds`);
        voice.play(`${this.client.config.audio.musicFolder}/ding.wav`)
            .on('end', async () => {


                const fileName = await this.client.AudioStorage.record(message.author, voice, timeout);
                if (!fileName) throw new Error('something went wrong while recording');
                const pM = this.client.AudioStorage.encodePrivacyMode(await this.promptPrivacyMode(message, messages).catch((): null => null));
                if (pM === undefined) {
                    await this.client.AudioStorage.delete(fileName, true);
                    return;
                }

                const name = await this.promptName(message, messages).catch((): null => null);
                if (!name) {
                    await this.client.AudioStorage.delete(fileName, true);
                    return;
                }

                this.client.AudioStorage.add({
                    commandname: name,
                    privacymode: (pM as (0 | 1 | 2 | 3)), guild: message.guild.id, user: message.author.id,
                    filename: fileName,
                });

                if (pM === 0) {
                    await message.author.send(new MessageAttachment(`${this.client.config.audio.storage}/${fileName}`));
                    await this.client.AudioStorage.delete(fileName, true);
                }
                await message.success('I finished converting', `use "${this.client.settings.get(message.guild.id).prefix}play ${name}"`);
                voice.disconnect();
            });
    }

    private async promptName(message: BMessage, messages: Message[]): Promise<string> {
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
                if (await this.client.AudioStorage.nameExists(value)) {
                    messages.push(await message.warn(`\`${value}\` is already in use`, 'please send another name'));
                    return false;
                }
                return true;
            });
    }

    private async promptPrivacyMode(message: BMessage, messages: Message[]): Promise<string> {
        const msg = await message.channel.send(
            new MessageEmbed()
                .setTitle('What am I supposed to do with the recorded file?')
                .setDescription(this.infoMsg),
        );

        messages.push(msg);
        return Utils.promptMessage(msg, msg.channel, 30 * 1000 * 60,
            (m: Message): boolean => m.author.id === message.author.id,
            async (m: BMessage): Promise<boolean> => {
                messages.push(m);
                if (!this.replys.includes(m.content)) {
                    messages.push(await message.channel.send(`Please send a valid mode: \`${this.replys.join('` or `')}\``));
                    return false;
                }
                return true;
            });
    }

}

