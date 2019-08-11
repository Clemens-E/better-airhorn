require('dotenv').config()
import { Config } from '../configs/generalConfig';
const config: Config = require('../configs/config.js');
import Discord from 'discord.js';
import { BClient } from './struct/client';
import readdir from 'readdirp';

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
        messageSweepInterval: 61,
        messageCacheMaxSize: 20,
    });

    readdir(`${__dirname}/commands/`, {
        fileFilter: '*.ts'
    })
        .on('data', (e: any) => {
            client.commands.set(e.basename.split('.')[0], new (require(e.fullPath).default)(client));
        })
        .on('end', () => {
            console.log(`loaded ${client.commands.size} commands`);
        })

    let events = 0;
    readdir(`${__dirname}/events/`, {
        fileFilter: '*.ts'
    })
        .on('data', (e: any) => {
            client.on(e.basename.split('.')[0], require(e.fullPath).bind(null, client));
            events++;
        })
        .on('end', () => {
            console.log(`loaded ${events} events`);
        })

    client.login(process.env.BTOKEN);
})();
