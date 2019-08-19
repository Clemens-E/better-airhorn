import { exec } from 'child_process';
import { Message } from 'discord.js';

import { postText } from '../../classes/TextHandler';
import { BClient } from '../../models/client';
import Command from '../../models/command';


export default class Eval extends Command {

    public constructor(client: BClient) {
        super(client,
            {
                name: 'exec',
                category: 'owner',
                example: 'exec rm /',
                description: 'executes commands in the shell',

                userPermissions: [],
                userChannelPermissions: [],

                botPermissions: [],
                botChannelPermissions: ['SEND_MESSAGES'],

                voiceChannel: false,
                voteLock: false,
            });
    }

    public async exec(client: BClient, message: Message, args: string[]): Promise<any> {
        if (message.author.id !== client.config.general.ownerID) return;
        exec(args.join(' '), async (error, stdout): Promise<void> => {
            let output = (error || stdout) as string;
            if (output.length < 2000) output = `\`\`\`asciidoc\n${output}\`\`\``;
            else output = await postText(output);
            message.channel.send(output);
        });
    }
}

