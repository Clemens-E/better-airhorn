module.exports.run = async (client, message, args) => {
    client.settings.set(message.guild.id, args.join(' '), 'prefix');
    message.channel.send(`Changed prefix to ${args.join(' ')}`);
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