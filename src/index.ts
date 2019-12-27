import { Util } from 'discord.js';
import { BClient } from './client/Client';
import { BMessage } from './structures/Message';
import 'dotenv/config';

BMessage;
(async (): Promise<void> => {
    const client = new BClient({
        shardCount: await Util.fetchRecommendedShards(process.env.BTOKEN, 1000),
        presence: {
            status: 'idle',
            activity: {
                name: 'Shard Starting',
            },
        },
        messageCacheLifetime: 120,
        messageSweepInterval: 60,
        messageCacheMaxSize: 20,
        disabledEvents:['TYPING_START'],
    });

    client.start();
})();
