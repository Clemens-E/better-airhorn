import { TextChannel } from 'discord.js';

import { BClient } from '../client/Client';

const events: any = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

module.exports = async (client: BClient, event: any): Promise<void> => {

    // ! WILL REJECT EVERY EVENT THAT IS FOR OTHER EMOJIS
    // TODO: EXTEND REACTION COLLECTOR AND REMOVE THIS CRAP

    // * Only need those two events.
    if (!events.hasOwnProperty(event.t)) return;

    const { d: data } = event;
    const user = client.users.get(data.user_id);
    const channel = (client.channels.get(data.channel_id) || await user.createDM()) as TextChannel;

    if (channel.messages.has(data.message_id)) return;

    const emojiKey = data.emoji.id || data.emoji.name;

    if (!['👍', '👎', '◀', '▶', client.config.emojis.import].includes(emojiKey)) return;
    const message = await channel.messages.fetch(data.message_id).catch((): null => null);
    if (!message) return;

    const reaction = message.reactions.get(emojiKey) || message.reactions.add(data);

    client.emit(events[event.t], reaction, user);
    if (message.reactions.size === 1) message.reactions.delete(emojiKey);
};