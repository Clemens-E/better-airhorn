const {
    version,
    MessageEmbed,
} = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
const cpuStat = require('cpu-stat');
const lag = require('event-loop-lag')(1000);
const fetch = require('node-fetch');
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
        const shards = client.ws.shards.map(x => ({
            id: x.id,
            status: x.status,
        }));
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
Event Loop Lag: ${lag().toFixed(2)} Milliseconds
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
            .addField('**> Shards**', `
            ${shards.map(x=> `Shard ${x.id}: ${x.status === 0 ? '<:online:596442525636624409> Online' : [1, 2].includes(x.status) ? `${client.config.loading} Reconnecting` : '<:offline:596443669280587776> Offline'}`).join('\n')}
`)
            .addField('**> Other Services**', `
[Vote Server](https://webhooks.chilo.space/better-airhorn/): ${await checkStatus('https://webhooks.chilo.space/better-airhorn/')}
[Status Page](https://bots.chilo.space/better-airhorn): ${await checkStatus('https://bots.chilo.space/better-airhorn')}
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

async function checkStatus(url) {
    const status = (await fetch(url)).status;
    return (status < 300 && status >= 200 ? '<:online:596442525636624409> Online' : '<:offline:596443669280587776> Offline / Error');
}