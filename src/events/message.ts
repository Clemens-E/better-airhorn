import { BClient, BMessage } from "../struct/client";
import { Message, MessageEmbed } from "discord.js";

module.exports = (client: BClient, message: BMessage) => {
    if (message.author.bot || message.channel.type === 'dm') return;
    client.settings.ensure(message.guild.id, { prefix: client.config.general.prefix });

    const prefix = client.settings.get(message.guild.id, 'prefix');
    if (/^(<@!?${client.user.id}>)/.test(message.content))
        message.neutral(`Prefix on this Guild: \`${prefix}\``);

    if (message.content.indexOf(prefix) !== 0) return;

    const { channel, author, member, content, guild } = message;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const cmd = client.commands.get(command);

    if (!cmd) return;

    while (args[0] && args[0][0] === '-') {
        message.flags.push(args.shift().slice(1));
    }

    // TODO: NOT FINISHED YET, THIS IS JUST TO TEST IF EXECUTING COMMANDS WORKS
    //! ##################################################################### //
    //! ############################ NOT FINISHED ########################### //
    //! ##################################################################### //
    cmd.exec(client, message, args);

}