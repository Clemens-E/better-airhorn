import { BClient } from '../client/Client';
import { logger } from '../structures/utils/Logger';
import fetch, { Response } from 'node-fetch';

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
};

