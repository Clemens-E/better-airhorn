const {
    version,
    MessageEmbed,
} = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
const cpuStat = require('cpu-stat');
const ticks = '```';
module.exports.run = async (client, message) => {
    let commandsUsed = 0;
    const mostUsedCommand = {
        name: '',
        usage: 0,
    };

    client.usage.forEach((e, k) => {
        commandsUsed += e.usage.length;
        if (e.usage.length > mostUsedCommand.usage) {
            mostUsedCommand.name = k;
            mostUsedCommand.usage = e.usage.length;
        }
    });
    cpuStat.usagePercent(async function (err, percent) {
        if (err) {
            return message.channel.send('Something went wrong.');
        }
        const duration = moment.duration(client.uptime).format(' D [Days], H [Hours], m [Minutes], s [Seconds]');
        const embed = new MessageEmbed().setColor(client.config.cn);
        embed.addField('**> Bot User**', `${ticks}js
Uptime: ${duration}
Current Shard: ${message.guild.shardID}
Total Shards: ${message.guild.shard.manager.totalShards}

Most used Command: '${mostUsedCommand.name}' with ${mostUsedCommand.usage} executions
Total Command Usage: ${commandsUsed}

Users: ${client.guilds.map(g => g.memberCount).reduce((a, b) => a + b).toLocaleString()}
Channels: ${client.channels.size.toLocaleString()}
Guilds: ${client.guilds.size.toLocaleString()}
Voice Connections: ${client.voice.connections.size}
${ticks}
`)
            .addField('**> Host**', `
${ticks}js
CPU: ${os.cpus().map(i => `${i.model}`)[0]}
Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
CPU Usage: ${percent.toFixed(2)}%
Platform: ${os.platform}
${ticks}
`)
            .addField('**> Versions**', `
${ticks}js
Node.js: ${process.version}
Discord.js: ${version}
${ticks}
`)
            .setFooter(`Developer & Owner: ${(await client.users.fetch(client.config.ownerid).catch(()=> null)).tag}`);
        message.channel.send(embed);
    });
};

exports.help = {
    name: 'stats',
    category: 'others',
    example: 'stats',
    description: 'shows infos about this Bot',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
};