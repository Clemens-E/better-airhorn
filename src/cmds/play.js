module.exports.run = async (client, message, args) => {
    const {
        channel,
        author,
        guild,
    } = message;
    const deniedMsg = '<a:BE_NO:506521935803449345> Permission To Audio Clip Denied';
    const cmd = await client.AudioStorage.getAudioInfo(args[0]);
    if (!cmd) return channel.send(`I can't find such audio named \`${args[0]}\`:(`);
    switch (parseInt(cmd.privacymode)) {
        case 0:
            throw new Error('This should **never** happen, if this persists please report it in the support server.');
        case 1:
            if (author.id !== cmd.user) return channel.send(deniedMsg);
            break;
        case 2:
            if (author.id !== cmd.user && guild.id !== cmd.guild) return channel.send(deniedMsg);
            break;
        case 3:
            break;
        default:
            throw new Error(`This should **never** happen, if this persists please report it in the support server.
DEBUG INFO: Privacy Mode=${cmd.privacymode}`);
    }
    const conn = await message.member.voice.channel.join().catch(() => null);
    if (!conn) return channel.send('Something went wrong while joining your Voice Channel.');
    await client.AudioStorage.playAudio(conn, cmd.commandname);
    channel.send(`<a:BE_YES:513771657383378973> finished playing \`${args[0]}\``);
    conn.disconnect();
};

exports.help = {
    name: 'play',
    category: 'entertainment',
    example: 'play yeah_boi',
    description: 'will play an earlier recorded with "recordme" Audio Clip',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};