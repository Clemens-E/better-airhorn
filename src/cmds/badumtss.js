module.exports.run = (client, message, args) => require('../modules/util.js').playFile(message.member.voice.channel, './music/badumtss.mp3', args[0]);

exports.help = {
    name: 'badumtss',
    category: 'entertainment',
    example: 'badumtss',
    description: 'plays badumtss in your current voice channel',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};