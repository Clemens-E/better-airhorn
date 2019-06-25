const Discord = require('discord.js');
const $console = require('Console');
module.exports = async (client, guild) => {
    const mcount = guild.members.filter(m => !m.user.bot).size;
    const bcount = guild.members.filter(m => m.user.bot).size;
    if (bcount > 30 && mcount < bcount) {
        guild.owner.send(`Hey, your guild has ${bcount} Bots and only ${mcount} Member. I dont like that, I will leave`).catch((O_o) => O_o);
        guild.leave();
        client.channels.get('461211772804792320').send(new Discord.MessageEmbed().setDescription(`Leaved Guild ${guild.name} with ${mcount} members and ${bcount} bots.\nReason: more bots than users`).setColor(8135099));
        client.leavedMyself = true;
        $console.stress(`Left Guild ${guild.name} with ${mcount} members and ${bcount} bots.\nReason: more bots than users`);
        const possiblechannels = guild.channels.filter((c) => c.permissionsFor(guild.me).has('SEND_MESSAGES') && c.type === 'text');
        if (possiblechannels.size === 0) return;
        possiblechannels.sort((c1, c2) => c1.position - c2.position);
        return possiblechannels.last().send(`Hey ${guild.owner}, your guild has ${bcount} Bots and only ${mcount} Member. I dont like that, I will leave`);
    }
    $console.success(`joined new guild | ${guild.name} | ${guild.memberCount}`);
    client.channels.get('461211772804792320').send(new Discord.MessageEmbed()
        .setColor(3127860)
        .addField('*Joined a new Guild*', 'New Guild')
        .addField('ID', guild.id, true)
        .addField('Name', guild.name, true)
        .addField('Owner', guild.owner.user.tag, true)
        .addField('Region', guild.region, true)
        .addField('Channels', guild.channels.size, true)
        .addField('Members', guild.memberCount, true)
        .addField('Humans', guild.memberCount - guild.members.filter(m => m.user.bot).size, true)
        .addField('Bots', guild.members.filter(m => m.user.bot).size, true)
        .addField('Guilds in total', `${client.guilds.size}`)).catch((O_o) => O_o);
    const possiblechannels = guild.channels.filter((c) => c.permissionsFor(guild.me).has('SEND_MESSAGES') && c.type === 'text');
    if (possiblechannels.size === 0) return;
    possiblechannels.sort((c1, c2) => c1.position - c2.position);
    possiblechannels.last().send(new Discord.MessageEmbed()
        .setColor(3127860)
        .addField('*Hello! Iam Better Airhorn*', 'Thanks for adding me to your server!')
        .addField('Find help:', '$help', true)
        .addField('Prefix', 'My default prefix is `$`. If you ever forget it,\njust ping me in the beginning of the message and I will tell you!')
        .setFooter(`This is the ${client.guilds.size} Guild I joined.`));

};