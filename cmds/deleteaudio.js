module.exports.run = async (client, message, args) => {
    const { channel, author } = message;
    const cmd = await client.AudioStorage.getAudioInfo(args[0]);
    if (!cmd) return channel.send(`can't find a Audio Clip named ${args[0]}`);
    if (cmd.user !== author.id) return channel.send('You can only delete AudioClips you created.');
    await client.AudioStorage.deleteAudio(cmd.filename);
    channel.send(`deleted ${cmd.filename}`);
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