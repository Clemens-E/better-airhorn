const Discord = require('discord.js');
module.exports = async (client, message) => {
    const prefix = client.config.prefix;
    if (message.channel.type == 'dm') return;
    if (message.author.bot) return;
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>)`);
    if (prefixRegex.test(message.content)) {
        message.channel.send(new Discord.MessageEmbed()
            .setColor(client.config.cn)
            .addField('Info', `Prefix on this Server: \`${prefix}\`\nDo \`${prefix}help\` for more information`));
    }
    if (message.content.indexOf(prefix) !== 0) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const cmd = client.commands.get(command);
    if (cmd) {
        message.flags = [];
        while (args[0] && args[0][0] === '-') {
            message.flags.push(args.shift().slice(1));
        }
        const channel = message.channel;
        const uMissingPerms = message.member.permissions.missing(cmd.help.userPermissions);
        const uChannelMissingPerms = channel.permissionsFor(message.member).missing(cmd.help.userChannelPermissions);
        const myMissingPerms = message.guild.me.permissions.missing(cmd.help.myPermissions);
        const myChannelMissingPerms = channel.permissionsFor(message.guild.me).missing(cmd.help.myChannelPermissions);

        if (myChannelMissingPerms.includes('SEND_MESSAGES')) return message.member.send(`I'm missing the following permissions:\`\`\`${myChannelMissingPerms.join('\n')}\`\`\``);
        if (myMissingPerms.length > 0) return channel.send(`I'm missing the following permissions:\`\`\`${myMissingPerms.join('\n')}\`\`\``);
        if (myChannelMissingPerms.length > 0) return channel.send(`I'm missing the following permissions:\`\`\`${myChannelMissingPerms.join('\n')}\`\`\``);
        if (uMissingPerms.length > 0) return channel.send(`You are missing the following permissions:\`\`\`${uMissingPerms.join('\n')}\`\`\``);
        if (uChannelMissingPerms.length > 0) return channel.send(`You are missing the following permissions:\`\`\`${uChannelMissingPerms.join('\n')}\`\`\``);
        if (cmd.help.inVoiceChannel) {
            if (!message.member.voice.channel) return channel.send('You have to be in a voice channel.');
            if (!message.member.voice.channel.joinable) return channel.send('I\'m not able to join your voice channel, is it full?');
        }
        if (cmd.help.needsStorage) {
            if (client.audioFolderSize > 20) {
                channel.send('The Audio Storage is full. I hope there will be more soon.');
                console.error(`AUDIO STORAGE IS FULL: ${client.audioFolderSize} GB`);
                return;
            }
        }
        if (!client.usage.has(command)) {
            client.usage.set(command, {
                usage: [],
            });
        }
        client.usage.push(command, {
            time: Date.now(),
            user: message.author.id,
        }, 'usage', true);

        cmd.run(client, message, args).catch(e => {
            channel.send(
                new Discord.MessageEmbed()
                .setTitle(`${client.config.crashed} ${cmd.help.name} Crashed`)
                .setColor(client.config.ce)
                .addField('Is this an Issue?', 'If the Problem consists please report it [here](https://discordapp.com/invite/5m7Xss3 \'Support Server\')')
                .addField('Error', `\`\`\`js\n${e.message} \`\`\``)
            );
            console.error(e);
        });
    }
};