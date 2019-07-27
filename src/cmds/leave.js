module.exports.run = (client, message) => {
    message.member.voice.channel.leave();
};


exports.help = {
    name: 'leave',
    category: 'entertainment',
    example: 'leave',
    description: 'I will leave your voice channel :(',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};