module.exports.run = async (client, message) => {
    client.generateInvite(36703232).then(l => message.channel.send(`<${l}>`));
};

exports.help = {
    name: 'invite',
    category: 'others',
    example: 'invite',
    description: 'Sends a Invite for the Bot',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
};