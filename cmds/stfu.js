module.exports.run = (client, message, args) => require('../modules/util.js').playFile(message.member.voice.channel, './music/stfu.mp3', args[0]);

exports.help = {
    name: 'stfu',
    category: 'entertainment',
    example: 'stfu',
    description: 'plays pewdiepie `stfu` in your voice channel',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};