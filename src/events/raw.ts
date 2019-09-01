import Discord, { TextChannel } from 'discord.js';

import { BClient } from '../models/Client';


module.exports = async (client: BClient, event: any): Promise<void> => {
    // * Only need those two events.
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(event.t)) return;

    const {
        d: data,
    } = event;
    const user = client.users.get(data.user_id);
    const channel = client.channels.get(data.channel_id) as TextChannel || await user.createDM();
    let message = channel.messages.get(data.message_id);

    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;

    // ! WILL REJECT EVERY EVENT THAT IS FOR OTHER EMOJIS
    // TODO: EXTEND REACTION COLLECTOR AND REMOVE THIS CRAP
    if (['👍', '👎'].includes(emojiKey)) return;

    if (event.t === 'MESSAGE_REACTION_REMOVE' && message && message.reactions.get(emojiKey) && message.reactions.get(emojiKey).users.size) return;
    if (event.t === 'MESSAGE_REACTION_ADD' && message) return;


    if (!message) {
        message = await channel.messages.fetch(data.message_id).catch((): null => null);
    }
    if (!message) return;
    if (!message.reactions) return;
    let reaction = message.reactions.get(emojiKey);

    if (!reaction) {
        const emoji = new Discord.Emoji(client, data.emoji);
        reaction = new Discord.MessageReaction(client, emoji, message);
    }

    if (event.t === 'MESSAGE_REACTION_ADD') {
        client.emit('messageReactionAdd', reaction, user);
    }
    if (event.t === 'MESSAGE_REACTION_REMOVE') {
        client.emit('messageReactionRemove', reaction, user);
    }
};