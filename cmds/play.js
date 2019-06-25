module.exports.run = async (client, message, args) => {
    const channel = message.channel;
    if (!await client.AudioStorage.nameExists(args[0])) return channel.send('I cant find such audio :(');
    // ! CHECK FOR PERMISSIONS!!!!
    const conn = await message.member.voice.channel.join().catch(() => null);
    if (!conn) return channel.send('Something went wrong while joining your Voice Channel.');
    await client.AudioStorage.playAudio(conn, args[0]);
    channel.send(`finished playing ${args[0]}`);
    conn.disconnect();
};

exports.help = {
    name: 'recordme',
    category: 'entertainment',
    example: 'recordme',
    description: 'will record a short audio clip of you',
    userPermissions: ['MANAGE_GUILD'],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};