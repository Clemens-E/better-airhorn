import 'dotenv/config';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { BAClient } from './BAClient';
import { Config } from './config/Config';
import { entities } from './entities/entities';
import './events/LoggingEvents';
import { services } from './services/services';
import { isDev } from './utils/isEnvironment';
import { logger } from './utils/Logger';

createConnection({
  type: 'postgres',
  url: Config.credentials.postgresql.url,
  logging: false ?? isDev(),
  synchronize: isDev(),
  entities,
})
  .then(async () => {
    const client = new BAClient({
      commandDirectory: `${__dirname}/commands`,
      eventsDirectory: `${__dirname}/events`,
      mentionPrefix: true,
      prefix: '$$',
      ownerIds: Config.general.ownerIds,
      services,
    }, {});

    if (isDev()) {
      client.on('debug', (info) => logger.debug(info));
    }

    await client.start(Config.credentials.discord.token);
  });

