import fetch from 'node-fetch';

import { postText } from '../../classes/TextHandler';
import { BClient, BMessage } from '../../models/client';
import Command from '../../models/command';


export default class Eval extends Command {

    public constructor(client: BClient) {
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

    public async exec(client: BClient, message: BMessage, args: string[]): Promise<any> {
        message.channel.send(message.author.id === client.config.general.ownerID && !message.flags.includes('b') ?
            await this.asOwner(client, message, args.join(' '))
            : await this.asGuest(client, args.join(' '))
        );
    }


    private async asOwner(client: BClient, message: BMessage, code: string): Promise<string> {
        let evaled;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { channel, guild, author } = message;
        try {
            evaled = await eval(code);
        } catch (err) {
            evaled = err.message;
        }
        return this.clean(evaled);
    }

    private async asGuest(client: BClient, code: string): Promise<string> {
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
        if (res.message) return this.clean(res.message);
        if (!!res.stderr && res.stderr.length > 0) return this.clean(res.stderr.split('\n')[4]);
        return this.clean(res.stdout);
    }

    public async clean(text: any): Promise<string> {
        if (!!text && !!text.constructor && (text.constructor.name == 'Promise' || text.constructor.name == 'WrappedPromise')) {
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
        if (text.length > 1500) return postText(text);
        else return `\`\`\`xl\n${text}\n\`\`\``;
    }
}

