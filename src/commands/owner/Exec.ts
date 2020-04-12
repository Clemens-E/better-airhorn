import { Command, CommandBase, Message, UseGuard } from 'shori';
import { ArgsGuard } from '../../guards/ArgsGuard';
import { Util } from 'discord.js';
import { exec } from 'child_process';

@Command('exec', {
    channel: 'any',
    category: 'owner',
    example: 'exec pwd',
    description: 'executes shell commands',
    onlyOwner: true,
})
export class ExecCommand extends CommandBase {
    @UseGuard(new ArgsGuard(1))
    async exec(message: Message, args: string[]): Promise<any> {
        const code = args.join(' ');
        exec(code, async (error, stdout): Promise<any> => {
            let output: string | string[] = (error || stdout) as string;
            if ((output as string).length > 1900) output = Util.splitMessage(output, { prepend: '```asciidoc\n', append: '```', maxLength: 1900 });
            else output = `\`\`\`asciidoc\n${output}\`\`\``;

            if (output instanceof Array) return output.forEach(o => message.channel.send(o));
            return message.channel.send(output);
        });
    }
}