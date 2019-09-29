import { Message, MessageAttachment, VoiceConnection } from 'discord.js';

import { Utils } from '../../structures/utils/Utils';
import { BClient } from '../../client/Client';
import { Command } from '../../structures/Command';
import { BMessage } from '../../structures/Message';

export default class Record extends Command {
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

                const pM = this.client.AudioStorage.encodePrivacyMode(await Utils.promptPrivacyMode(this.client, message, messages).catch((): null => null));
                if (pM === undefined) {
                    await this.client.AudioStorage.delete(fileName, true);
                    return;
                }

                const name = await Utils.promptName(this.client, message, messages).catch((): null => null);
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
                message.channel.bulkDelete(messages).catch(() => null);
                voice.disconnect();
            });
    }


}

