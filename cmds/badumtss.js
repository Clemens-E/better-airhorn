module.exports.run = async (client, message, args) => {
    let volume = 1;
    const parsed = parseFloat(args[0]);
    if (parsed && parsed > 0 && parsed < 20) volume = parsed;
    const voiceChannel = message.member.voice.channel;
    voiceChannel.join().then(connection => {
        const dispatcher = connection.play('./music/badumtss.mp3', {
            volume: volume,
        });
        dispatcher.on('end', () => {
            voiceChannel.leave();
        });
    });
};

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