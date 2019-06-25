const Discord = require('discord.js');
module.exports = async (client, guild) => {
    if (client.leavedMyself) return client.leavedMyself = false;
    client.channels.get('461211772804792320').send(new Discord.MessageEmbed()
        .setColor(16711680)
        .addField('*Leaved a Guild*', `The Traitor: "${guild.name}"`)
        .addField('ID', guild.id, true)
        .addField('Name', guild.name, true)
        .addField('Owner', guild.owner.user.tag, true)
        .addField('Region', guild.region, true)
        .addField('Channels', guild.channels.size, true)
        .addField('Members', guild.memberCount, true)
        .addField('Humans', guild.memberCount - guild.members.filter(m => m.user.bot).size, true)
        .addField('Bots', guild.members.filter(m => m.user.bot).size, true));
};