import { exec } from 'child_process';
import { Message, VoiceConnection } from 'discord.js';

import { postText } from '../../classes/textHandler';
import { BClient } from '../../struct/client';
import Command from '../../struct/command';

export default class Eval extends Command {

    constructor(client: BClient) {
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

    async exec(client: BClient, message: Message, args: string[], voice?: VoiceConnection): Promise<any> {
        if (message.author.id !== client.config.general.ownerID) return;
        exec(args.join(' '), async (error, stdout) => {
            let output = (error || stdout) as string;
            if (output.length < 2000) output = `\`\`\`asciidoc\n${output}\`\`\``;
            else output = await postText(output);
            message.channel.send(output);
        });
    }
}

