require('dotenv').config();
import Discord from 'discord.js';
import readdir from 'readdirp';

import { BClient } from './models/Client';
import { logger } from './classes/Logger';
import { BMessage } from './models/Message';
BMessage;
(async (): Promise<void> => {
    const client = new BClient({
        shardCount: await Discord.Util.fetchRecommendedShards(process.env.BTOKEN, 1000),
        presence: {
            status: 'idle',
            activity: {
                name: 'Shard Starting',
            },
        },
        messageCacheLifetime: 120,
        messageSweepInterval: 60,
        messageCacheMaxSize: 20,
    });
    readdir(`${__dirname}/commands/`, {
        fileFilter: ['*.ts', '*.js'],
    })
        .on('data', (e: any): void => {
            client.commands.set(e.basename.split('.')[0], new (require(e.fullPath).default)(client));
        })
        .on('end', (): void => {
            logger.debug(`loaded ${client.commands.size} commands`);
        });

    let events = 0;
    readdir(`${__dirname}/events/`, {
        fileFilter: ['*.ts', '*.js'],
    })
        .on('data', (e: any): void => {
            client.on(e.basename.split('.')[0], require(e.fullPath).bind(null, client));
            events++;
        })
        .on('end', (): void => {
            logger.debug(`loaded ${events} events`);
        });

    client.login(process.env.BTOKEN);

    // this has to be down here because it Wraps Promises, this interferes with enmaps type checking
    require('appmetrics-dash').monitor({ port: 8000, console: { log: logger.info, error: logger.error } });
})();
