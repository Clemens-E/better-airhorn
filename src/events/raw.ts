import { BClient } from '../models/client';
import { TextChannel } from 'discord.js';

module.exports = (client: BClient, packet: any): void => {
    // * Only need those two events.
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;

    const channel = client.channels.get(packet.d.channel_id) as TextChannel;
    if (channel.messages.has(packet.d.message_id)) return;

    channel.messages.fetch(packet.d.message_id).then(message => {
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

        // ! WILL REJECT EVERY EVENT THAT IS FOR OTHER EMOJIS
        // TODO: EXTEND REACTION COLLECTOR AND REMOVE THIS CRAP
        if (['👍', '👎'].includes(emoji)) return;

        const reaction = message.reactions.get(emoji);
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
};