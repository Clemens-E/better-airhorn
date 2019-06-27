module.exports.run = async (client, message, args) => {
    const {
        channel,
        author,
        guild,
    } = message;
    switch ((args[0] || 'baka').toLowerCase()) {
        case 'all':
            channel.send(`All Public Audios:\n${ (await client.AudioStorage.getAudioList()).filter(x=> x.privacymode === 3).map(x => `\`${x.commandname}\``).join('\n')}`);
            break;
        case 'mine':
            channel.send(`All Audios owned by you:\n${ (await client.AudioStorage.getAudioList()).filter(x => x.user === author.id).map(x => `\`${x.commandname}\``).join('\n')}`);
            break;
        case 'guild':
            channel.send(`All Public Audios only for this Guild:\n${ (await client.AudioStorage.getAudioList()).filter(x=> x.privacymode === 2 && x.guild === guild.id).map(x => `\`${x.commandname}\``).join('\n')}`);

            break;
        default:
            channel.send('Wrong argument. Arguments: `all`, `mine`, `guild`\nExample: `$listaudios mine`');
            break;
    }
};


exports.help = {
    name: 'deleteaudio',
    category: 'entertainment',
    example: 'deleteaudio hehe-boi',
    description: 'will delete a recorded Audio Clip',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
};