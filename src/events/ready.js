const $console = require('Console');
const {
    writeFileSync,
} = require('fs');
const pg = require('pg');
const util = require('../modules/util.js');

module.exports = async (client) => {
    client.ready = true;
    const pool = new pg.Pool({
        connectionString: client.config.psqllogin,
    });
    client.AudioStorage = new (require('../modules/AudioStorage.js'))(pool, './recordedAudio', 40);
    client.voice.connections.forEach(e => e.leave().catch(() => null));
    client.dbl.postStats(client.guilds.size, undefined, client.guilds.first().shard.manager.totalShards);
    client.dblAPI = new util.dbl(client.config.voteurl, client.config.voteauth);
    if (client.settings.has('lastMessage')) {
        const dat = client.settings.get('lastMessage');
        const msg = await client.channels.get(dat.channel).messages.fetch(dat.msg);
        msg.edit(`\`\`\`css\n${dat.content}\`\`\`*restart completed*`);
        client.settings.delete('lastMessage');
    }
    writeFileSync('./storage/guildCount.json', JSON.stringify({
        size: client.guilds.size,
    }));
    let counter = 0;
    $console.success(`client is ready after ${process.uptime() * 1000 - client.uptime} Milliseconds`);
    $console.success(`${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.guilds.map(g => g.memberCount).reduce((a, b) => a + b)} users.`);
    $console.log(`logged in as ${client.user.tag}`);
    setInterval(changing_status, 12001);

    function changing_status() {
        const status = [`${client.guilds.size.toLocaleString()} Guilds`, 'Tag me for Info', `${client.guilds.map(g => g.memberCount).reduce((a, b) => a + b).toLocaleString()} Users`, `${client.channels.size.toLocaleString()} Channels`, '$invite to get a invite Link', 'NEW UPDATE, DO $help'];
        counter++;
        if (counter === status.length) counter = 0;
        client.user.setActivity(status[counter]);
    }
    setInterval(() => {
        client.dbl.postStats(client.guilds.size, undefined, client.guilds.first().shard.manager.totalShards);
    }, 100000);
};