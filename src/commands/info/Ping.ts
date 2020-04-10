import { Command, CommandBase, Message } from 'shori';
import { MessageEmbed } from 'discord.js';

@Command('ping', {
    channel: 'any',
    category: 'info',
    description: 'gets latency to discord\' api',
})
export class PingCommand extends CommandBase {
    async exec(message: Message): Promise<any> {
        const m = await message.channel.send(new MessageEmbed().setDescription('Pinging...'));
        const embed = new MessageEmbed()
            .setDescription(`🏓 ${this.client.ws.ping}ms`);
        return m.edit(embed);
    }
}