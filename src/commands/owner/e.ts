import { Message, VoiceConnection } from 'discord.js';
import fetch from 'node-fetch';
import { postText } from '../../classes/textHandler';

import { BClient } from '../../struct/client';
import Command from '../../struct/command';

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
        message.channel.send(message.author.id === client.config.general.ownerID ?
            await this.asOwner(client, args.join(' '), message)
            : await this.asGuest(client, args.join(' '))
        );
    }


    async asOwner(client: BClient, code: string, message: Message) {
        let evaled;
        try {
            evaled = eval(code);
        }
        catch (err) {
            evaled = err.message;
        }
        return await this.clean(evaled);
    }

    async asGuest(client: BClient, code: string) {
        const res = await (await fetch('https://run.glot.io/languages/javascript/latest', {
            method: 'POST',
            headers: {
                Authorization: 'Token ' + process.env.GLOTTOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'files': [{
                    'name': 'index.js',
                    'content': code,
                }],
            }),
        })).json();
        if (res.message) return await this.clean(res.message);
        if (!!res.stderr && res.stderr.length > 0) return await this.clean(res.stderr);
        return await this.clean(res.stdout);
    }

    async clean(text: string): Promise<string> {
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
            .replace(process.env.BTOKEN, '// ---------- NO ---------- //')
            .replace(process.env.GLOTTOKEN, '// ---------- NO ---------- //')
            .replace(process.env.DBLTOKEN, '// ---------- NO ---------- //')
            .replace(process.env.PSQL, '// ---------- NO ---------- //');
        if (text.length > 1500) return await postText(text);
        else return `\`\`\`xl\n${text}\n\`\`\``;
    }
}

