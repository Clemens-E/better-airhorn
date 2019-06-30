module.exports.run = (client, message, args) => require('../modules/util.js').playFile(message.member.voice.channel, './music/johncena.mp3', args[0]);


exports.help = {
    name: 'john',
    category: 'entertainment',
    example: 'john',
    description: 'plays john cena in your current voice channel',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};