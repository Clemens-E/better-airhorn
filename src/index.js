const Discord = require('discord.js');
const dbl = require('dblapi.js');
const fs = require('fs');
const $console = require('Console');
const config = require(`${__dirname}/../config.json`);
const Enmap = require('enmap');
const http = require('http');
const shardCount = (parseInt(JSON.parse(fs.readFileSync(`${__dirname}/storage/guildCount.json`)).size / 500, 10)) || 0;
const client = new Discord.Client({
    shardCount: shardCount !== 0 ? shardCount : 'auto',
    presence: {
        status: 'idle',
        activity: {
            name: 'Shard Starting',
        },
    },
    // Keep RAM usage low, because nobody needs the messages.
    messageCacheLifetime: 60,
    messageSweepInterval: 61,
});
client.sentry = require('@sentry/node');
client.config = config;
client.dbl = new dbl(client.config.dbltoken);
client.settings = new Enmap({
    name: 'settings',
});
client.usage = new Enmap({
    name: 'usage',
});
if (config.prod) {
    client.sentry.init({
        dsn: config.sentry,
    });
    $console.warn('reporting errors to sentry');
}
process.on('unhandledRejection', error => {
    $console.error(error.stack);

});

fs.readdir(`${__dirname}/events/`, (err, files) => {
    let eventssize = 0;
    if (err) return $console.error(err);
    files.forEach(file => {
        eventssize++;
        const event = require(`${__dirname}/events/${file}`);
        const eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
    });
    $console.success(`loaded ${eventssize} events`);
});

client.commands = new Enmap();
fs.readdir(`${__dirname}/cmds/`, (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const props = require(`${__dirname}/cmds/${file}`);
        const commandName = file.split('.')[0];
        client.commands.set(commandName, props);
    });
    $console.success(`loaded ${client.commands.size} commands`);
});
client.login(config.token);

// Listen on http requests for uptime robot
http.createServer((req, res) => {
    const mapped = client.ws.shards.map(x => x.status);
    if (mapped.length === 0) mapped.push(10);
    res.writeHead(mapped.reduce((a, b) => a + b) ===
        0 ? 200 : 500, {
            'Content-Type': 'text/html',
        });
    res.write(`Process is online, all statuses of the clients are: ${client.ws.shards.map(x=> x.status).join(';')}`);
    res.end();
}).listen(3001);