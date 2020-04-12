require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
import 'reflect-metadata';
import { BAClient } from './client/BAClient';
import { Config } from './config/Config';
import './events/LoggingEvents';
import { services } from './services/services';

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