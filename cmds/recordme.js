const Discord = require('discord.js');
const fsp = require('fs').promises;
const ticks = '```';
// 5 Minutes.
const maxTime = 2 * 1000 * 60;
module.exports.run = async (client, message, args) => {
    const messages = [];
    messages.push(message);
    if (message.guild.voice && message.guild.voice.connection) return message.channel.send('I\'m already busy in this guild.');
    const {
        channel,
        author,
        guild,
    } = message;

    if (!(await client.dblAPI.hasVoted(author.id))) {
        return channel.send(new Discord.MessageEmbed().setDescription(`This is a Beta Feature and requires a lot of Performance and Storage.
You did not vote in the last 24 Hours. [Click me to Vote](https://discordbots.org/bot/503996428042108928/vote 'Vote for me!')
If you already voted, but this doesn't work, wait up to 5 Minutes.`)
            .setColor(client.config.cw));
    }


    const tmpPath = `${client.AudioStorage.dirPath}/${author.id}-${guild.id}.tmp`,
        fileName = `${client.AudioStorage.getNewPath(message.guild.shard.id)}.mp3`;

    const fileStat = await client.AudioStorage.fileExists(tmpPath);
    if (fileStat.exists) {
        if (fileStat.birthtime + maxTime < Date.now()) await fsp.unlink(tmpPath);
        else return channel.send(`I'm already recording you.\nIf not, wait ${(((fileStat.birthtime + maxTime) - Date.now()) / 1000 / 60).toFixed(1)} Minutes and try again`);
    }

    const parsed = (parseInt(args[0]) * 1000) || 5000;
    const timeout = parsed > 5000 ? 5000 : parsed;

    const conn = await message.member.voice.channel.join().catch(() => null);
    if (!conn) return channel.send('Something went wrong while joining your Voice Channel.');

    messages.push(await channel.send(`I will record ${author.username}'s voice for ${timeout / 1000} Seconds`));
    conn.play('./music/ding.wav');

    const recorded = await client.AudioStorage.record(author, conn, tmpPath, fileName, timeout);
    if (!recorded) return channel.send('Something went wrong.');
    let name;
    while (!name) {

        messages.push(await channel.send('What should the name of the clip be? ||`/cancel` to cancel||'));
        name = (await channel.awaitMessages(m => m.author.id === author.id, {
            max: 1,
            time: 300000,
            errors: ['time'],
        }).catch(() => new Discord.Collection())).first();
        messages.push(name);
        name = name.content;
        if (name === '/cancel' || name === undefined) {
            await channel.send('Canceling Command, Deleting Clip');
            await channel.bulkDelete(messages);
            await fsp.unlink(`${client.AudioStorage.dirPath}/${fileName}`);
            return;
        }
        if (name.includes(' ')) {
            messages.push(await channel.send('Spaces are not allowed. Please reply with another name.'));
            name = undefined;
        }
        if (await client.AudioStorage.nameExists(name)) {
            messages.push(await channel.send(`\`${name}\` is already taken. Please reply with another name.`));
            name = undefined;
        }
    }
    const options = {
        fileName: fileName,
        commandName: name,
    };

    const replys = client.AudioStorage.privacyOptions;
    messages.push(await channel.send(
        new Discord.MessageEmbed().setTitle('What am I supposed to do with the recorded MP3?')
        .setDescription(`
**Options:**
${ticks}asciidoc
[${replys[0]}]
I will send you the clip and delete it from my FileSystem.
${ticks}
${ticks}asciidoc
[${replys[1]}]
Only you are able to play this clip. By choosing this, you allow me to save the record on my FileSystem
${ticks}
${ticks}asciidoc
[${replys[2]}]
Only people in this Guild will be able to play it. You can play it everywhere else. By choosing this, you allow me to save the record on my FileSystem
${ticks}
${ticks}asciidoc
[${replys[3]}]
!!Everyone!! (REALLY EVERYONE) will be able to play this. By choosing this, you allow me to save the record on my FileSystem
${ticks}`),
    ));

    const collector = channel.createMessageCollector(m => m.author.id === author.id, {
        time: 120000,
    });
    collector.on('collect', async (m) => {
        messages.push(m);
        if (!replys.includes(m.content)) return messages.push(await channel.send(`Please send a valid mode: \`${replys.join(' ` or ` ')}\``));
        options.privacyMode = m.content;
        collector.stop();
    });
    collector.on('end', async () => {
        if (!options.privacyMode) {
            await channel.send('Canceling Command, Deleting Clip');
            await channel.bulkDelete(messages);
            await fsp.unlink(`${client.AudioStorage.dirPath}/${fileName}`);
            return;
        }
        const cmdName = await client.AudioStorage.addAudio(author.id, guild.id, options);
        await channel.send(`<a:BE_YES:513771657383378973> Added ${cmdName}. ||Use \`$play ${cmdName}\` to play the Audio Clip||`);
        if (options.privacyMode === 0) {
            await author.send(new Discord.MessageAttachment(`${client.AudioStorage.dirPath}/${fileName}`));
            await client.AudioStorage.deleteAudio(fileName);
        }
        await channel.bulkDelete(messages);
    });
};

exports.help = {
    name: 'recordme',
    category: 'entertainment',
    example: 'recordme',
    description: 'will record a short audio clip of you, use "play <name>"',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    needsStorage: true,
    inVoiceChannel: true,
};