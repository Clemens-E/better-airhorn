module.exports.run = (client, message, args) => require('../modules/util.js').playFile(message.member.voice.channel, './music/trashman.mp3', args[0]);

exports.help = {
    name: 'trashman',
    category: 'entertainment',
    example: 'trashman',
    description: 'plays `Iam the trashman` audio clip in your current voice channel',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};