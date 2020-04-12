import { Command, CommandBase, Message, UseGuard } from 'shori';
import { ArgsGuard } from '../../guards/ArgsGuard';
import { Util } from 'discord.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fetch from 'node-fetch';
import util from 'util';

@Command('e', {
    channel: 'any',
    category: 'owner',
    example: 'e client.uptime',
    description: 'executes javascript',
    onlyOwner: true,
})
export class ECommand extends CommandBase {
    @UseGuard(new ArgsGuard(1))
    async exec(message: Message, args: string[]): Promise<any> {
        let evaled: string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { channel, guild, author } = message;

        try {
            evaled = await eval(`(async () => { ${args.join(' ')} })()`);
        } catch (err) {
            evaled = err.message;
        }

        return this.clean(evaled).then(res => {
            res.map(e => message.channel.send(`\`\`\`js\n${e}\`\`\``));
        });
    }

    async clean(text: any): Promise<string[]> {
        if (!!text && !!text.constructor && (text.constructor.name == 'Promise' || text.constructor.name == 'WrappedPromise')) {
            text = await text;
        }

        if (typeof text !== 'string') {
            text = util.inspect(text, {
                depth: 2,
            });
        }

        text = text
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203))
            .replace(process.env.PG, '// ---------- NO ---------- //')
            .replace(process.env.DISCORD_TOKEN, '// ---------- NO ---------- //')
            .replace(process.env.MINIO_AK, '// ---------- NO ---------- //')
            .replace(process.env.MINIO_SK, '// ---------- NO ---------- //')
            .replace(process.env.MINIO_URL, '// ---------- NO ---------- //');

        return Util.splitMessage(text);
    }
}