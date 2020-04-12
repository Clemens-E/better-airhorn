import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { Command, CommandBase, Message } from 'shori';

@Command('ping', {
  channel: 'any',
  category: 'info',
  description: 'gets latency to discord\' api',
})
export class PingCommand extends CommandBase {

  async exec(message: Message): Promise<any> {
    const startTime = Date.now();
    const embed = new MessageEmbed()
      .setDescription(stripIndents`
            ⚙️  ${startTime - message.eventEmittedAt}ms - Time to command execution
            🏓  ${this.client.ws.shards.map(shard => shard.ping).reduce((a, b) => a + b, 0) / this.client.ws.shards.size}ms - Heartbeat
        `);
    return message.channel.send(embed);
  }
}
