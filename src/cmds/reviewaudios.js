const Discord = require('discord.js');
module.exports.run = async (client, message, args) => {
    const {
        channel,
        author,
    } = message;
    if (author.id !== client.config.ownerid) return;

    const conn = await message.member.voice.channel.join().catch(() => null);
    if (!conn) return channel.send('Something went wrong while joining your Voice Channel.');

    const dm = message.flags[0] === 'dm';
    const func = new Function('x', `return ${args.join(' ')}`);
    let audios;
    try {
        audios = (await client.AudioStorage.getAudioList()).filter(x => !x.reviewed).filter(func);
    } catch (e) {
        return channel.send('Your shit function didn\'t work retard');
    }

    let reviewed = 0;
    const messages = [];
    for (let index = 0; index < audios.length; index++) {
        const item = audios[index];
        const user = await client.users.fetch(item.user).catch(() => ({
            tag: 'Unknown',
        }));
        messages.push(await channel.send(`Now Playing \`${item.commandname}\` by \`${user.tag}\``));
        await client.AudioStorage.playAudio(conn, item.commandname);
        messages.push(await channel.send('Is the Audio okay or not? Answer with `y` to keep or `n` to delete'));
        const msg = (await channel.awaitMessages((m) => m.author.id === author.id && ['y', 'n'].includes(m.content), {
            max: 1,
            time: 300000,
            errors: ['time'],
        }).catch(() => new Discord.Collection())).first();
        if (!msg) break;
        messages.push(msg);
        const res = msg.content;
        reviewed++;
        // 'y' means keep, 'n' means delete
        if (res === 'y') {
            await client.AudioStorage.review(item.commandname, true);
            await channel.send(`reviewed \`${item.commandname}\`     :     \`${item.filename}\``);
        } else if (res === 'n') {
            await client.AudioStorage.deleteAudio(item.filename);
            await channel.send(`deleted \`${item.commandname}\`     :     \`${item.filename}\``);
            if (user.send && dm) {
                await user.send(`Your file ${item.commandname} was reviewed by a moderator and was found to be inappropriate and was deleted.\nIn the future please don't record inappropriate Audio. Thank you.`)
                    .catch(() => channel.send(`failed to dm ${user.tag}`));
            }
        }
    }
    await channel.send(`Finished for today. Reviewed a total of ${reviewed} Audios in this session`);
    await channel.bulkDelete(messages).catch(() => null);
    await conn.disconnect();
};

exports.help = {
    name: 'reviewaudios',
    category: 'owner commands',
    example: '-',
    description: 'goes trough the audios and checkst them for malicious content',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    inVoiceChannel: true,
};