require('dotenv').config();
import Discord from 'discord.js';
import readdir from 'readdirp';

import { BClient } from './models/client';


(async (): Promise<void> => {
    const client = new BClient({
        shardCount: await Discord.Util.fetchRecommendedShards(process.env.BTOKEN, 1000),
        presence: {
            status: 'idle',
            activity: {
                name: 'Shard Starting',
            },
        },
        messageCacheLifetime: 60,
        messageSweepInterval: 20,
        messageCacheMaxSize: 20,
    });

    readdir(`${__dirname}/commands/`, {
        fileFilter: '*.ts',
    })
        .on('data', (e: any): void => {
            client.commands.set(e.basename.split('.')[0], new (require(e.fullPath).default)(client));
        })
        .on('end', (): void => {
            console.log(`loaded ${client.commands.size} commands`);
        });

    let events = 0;
    readdir(`${__dirname}/events/`, {
        fileFilter: '*.ts',
    })
        .on('data', (e: any): void => {
            client.on(e.basename.split('.')[0], require(e.fullPath).bind(null, client));
            events++;
        })
        .on('end', (): void => {
            console.log(`loaded ${events} events`);
        });

    client.login(process.env.BTOKEN);

    // this has to be down here because it Wraps Promises, this interferes with enmaps type checking
    require('appmetrics-dash').monitor({ port: 8000, console: { log: (): void => null } });
})();
