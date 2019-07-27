module.exports.run = (client, message, args) => require('../modules/util.js').playFile(message.member.voice.channel, './music/airhorn.mp3', args[0]);

exports.help = {
    name: 'airhorn',
    category: 'entertainment',
    example: 'airhorn',
    description: 'plays a airhorn sound in your current voice channel',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};