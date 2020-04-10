import { Command, CommandBase, Message, UseGuard } from 'shori';
import { getRepository } from 'typeorm';
import { GuildSettings } from '../../entities/GuildSettings';
import { ArgsGuard } from '../../guards/ArgsGuard';

@Command('prefix', {
    channel: 'guild',
    userPermissions: ['MANAGE_GUILD'],
    category: 'config',
    example: 'prefix !ba',
    description: 'change the guilds prefix',
})
export class PrefixCommand extends CommandBase {

    @UseGuard(new ArgsGuard(1))
    async exec(message: Message, args: string[]): Promise<any> {
        const prefix = args.join(' ');
        if (prefix.length < 1) return message.error('prefixes must be at least 1 character');
        if (prefix.length > 3) return message.error('prefixes can\'t be longer than 3 characters');

        const settings = await getRepository(GuildSettings).findOne(message.guild.id);
        settings.prefix = args.join(' ');
        await settings.save();
        return message.success('successfully changed prefix', `prefix is ${settings.prefix}`);
    }

}
