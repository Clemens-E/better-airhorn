import { CronJob } from 'cron';
import fetch, { Response } from 'node-fetch';

import { BClient } from '../client/Client';
import { logger } from '../structures/utils/Logger';

let counter = 0;
module.exports = (client: BClient): void => {
    console.log(`ready as ${client.user.tag}`);

    function updateStatus(): void {
        const status = [`${client.guilds.size.toLocaleString()} Guilds`, 'Tag me for Info',
        `${client.guilds.map(g => g.memberCount).reduce((a, b) => a + b).toLocaleString()} Users`,
        `${client.channels.size.toLocaleString()} Channels`];
        counter++;
        if (counter === status.length) counter = 0;
        client.user.setActivity(status[counter]);
    }

    function postStats(): void {
        fetch(`https://discordbots.org/api/bots/${client.user.id}/stats`,
            {
                method: 'POST',
                headers: { 'Authorization': process.env.DBLTOKEN, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'server_count': client.guilds.size,
                    'shard_count': client.ws.shards.size,
                }),
            })
            .then((r: Response) => logger.debug(`posted stats ${r.status}`));
    }

    postStats();
    updateStatus();
    client.setInterval(postStats, 10 * 1_000 * 60);
    client.setInterval(updateStatus, 15 * 1_000);

    const query = 'INSERT INTO STATS(event, value) VALUES($1, $2)';
    const db = client.pg;
    new CronJob('0 * * * * *', async (): Promise<void> => {
        db.query(query, ['EVENT_LAG', (client.lag() as number).toFixed(2)]);
        db.query(query, ['GUILD_COUNT', client.guilds.size]);
        db.query(query, ['CHANNEL_COUNT', client.channels.size]);
        db.query(query, ['MESSAGES_PER_SECOND', client.messagesPerSecond]);
        db.query(query, ['PLAY_USAGE', (client.usage.get('play') || { usage: { length: 0 } }).usage.length]);
        db.query(query, ['VOICE_CONNECTIONS', client.voice.connections.size]);
        db.query(query, ['AVERAGE_PINGS', client.ws.shards.map(x => x.ping).reduce((a, b) => a + b) / client.ws.shards.size]);
        db.query(query, ['MEMORY_USAGE', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)]);
    }, null, true);
};

