module.exports.run = async (client, message, args) => {
    const prefix = args.join(' ');
    if (prefix.length > 20) return message.channel.send('Prefix too long.');
    client.settings.set(message.guild.id, prefix, 'prefix');
    message.channel.send(`Changed prefix to ${prefix}`);
};


exports.help = {
    name: 'setprefix',
    category: 'others',
    example: 'setprefix $',
    description: 'sets the prefix duh',
    userPermissions: ['MANAGE_GUILD'],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
};