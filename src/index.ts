require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
import 'reflect-metadata';
import { BAClient } from './client/BAClient';
import { Config } from './config/Config';
import './events/LoggingEvents';
import { services } from './services/services';
import { createConnection } from 'typeorm';
import { isDev } from './utils/isEnvironment';
import { entities } from './entities/entities';

(async function(): Promise<void> {
    await createConnection({
        name: 'default',
        type: 'postgres',
        url: Config.credentials.postgresql.url,
        logging: isDev(),
        synchronize: isDev(),
        entities,
    });

    const client = new BAClient({
        commandDirectory: `${__dirname}/commands`,
        eventsDirectory: `${__dirname}/events`,
        mentionPrefix: true,
        prefix: '$$',
        ownerIds: Config.general.ownerIds,
        services,
    }, {
        ws: {
            intents: Config.client.intents,
        },
    });

    client.start();
})();