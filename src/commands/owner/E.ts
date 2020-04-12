import { Command, CommandBase, Message, UseGuard } from 'shori';
import { ArgsGuard } from '../../guards/ArgsGuard';
import { TextUploadService } from '../../services/TextUploadService';
import util from 'util';

@Command('e', {
    channel: 'any',
    category: 'owner',
    example: 'e client.uptime',
    description: 'executes javascript',
    onlyOwner: true,
})
export class ECommand extends CommandBase {
    public constructor(private uploader: TextUploadService) { super(); }

    @UseGuard(new ArgsGuard(1))
    async exec(message: Message, args: string[]): Promise<any> {
        const m = await message.channel.send('evaluating...');
        let evaled: any;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { channel, guild, author } = message;

        try {
            evaled = eval(args.join(' '));
            if (evaled instanceof Promise) evaled = await evaled;
        } catch (err) {
            evaled = err.message;
        }

        const cleaned = await this.clean(evaled);
        if (cleaned.length > 1950) {
            const hastebin = `${this.uploader.base}/${await this.uploader.upload(cleaned)}`;
            return m.edit(hastebin);
        }

        return m.edit(cleaned);
    }

    async clean(text: any): Promise<string> {
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

        return text;
    }
}