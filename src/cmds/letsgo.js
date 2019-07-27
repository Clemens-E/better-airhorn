module.exports.run = (client, message, args) => require('../modules/util.js').playFile(message.member.voice.channel, './music/letsgo.mp3', args[0]);


exports.help = {
    name: 'letsgo',
    category: 'entertainment',
    example: 'letsgo',
    description: 'plays `LETS GO` in your current voice channel',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};