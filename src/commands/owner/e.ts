import fetch from 'node-fetch';
import Command from '../../struct/command';
import { Message, VoiceConnection, Channel } from 'discord.js';
import { BClient } from '../../struct/client';

export default class Eval extends Command {

    constructor(client: BClient) {
        super(client,
            {
                name: 'e',
                category: 'owner',
                example: 'e client.token',
                description: 'executes javascript code',

                userPermissions: [],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: ['SEND_MESSAGES'],

                voiceChannel: false,
                voteLock: false,
            });
    }

    async exec(client: BClient, message: Message, args: string[], voice?: VoiceConnection): Promise<any> {
        if (message.author.id === client.config.general.ownerID) return message.channel.send(await this.asOwner(client, args.join(' ')));
        else return message.channel.send(await this.asGuest(args.join(' ')));
    }


    async asOwner(client: BClient, code: string) {
        let evaled;
        try {
            evaled = eval(code);
        }
        catch (err) {
            evaled = err.message;
        }
        evaled = await this.clean(client, evaled);
        return evaled;
    }

    async asGuest(code: string) {

    }

    async postText(output: string): Promise<string> {
        const res = await (await fetch('https://txtupload.cf/api/upload',
            {
                method: 'POST',
                body: output,
                headers: {
                    'Content-Type': 'text/plain'
                }
            })).json();
        return `https://txtupload.cf/${res.hash}#${res.key}`;
    }

    async clean(client: BClient, text: string): Promise<string> {
        if (text && text.constructor.name == 'Promise') {
            text = await text;
        }
        if (typeof text !== 'string') {
            text = require('util').inspect(text, {
                depth: 2,
            });
        }

        text = text
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203))
            .replace(client.token, '// ---------- NO ---------- //')
            .replace(process.env.GLOTTOKEN, '// ---------- NO ---------- //')
            .replace(process.env.DBLTOKEN, '// ---------- NO ---------- //')
            .replace(process.env.PSQL, '// ---------- NO ---------- //');
        if (text.length > 1500) return await this.postText(text);
        else return `\`\`\`xl\n${text}\n\`\`\``;
    }
}

