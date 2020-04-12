import { ClientOptions } from 'discord.js';
import { ShoriClient, ShoriOptions } from 'shori';
import { createConnection, getRepository } from 'typeorm';
import { Config } from '../config/Config';
import { GuildSettings } from '../entities/GuildSettings';
import { entities } from '../entities/entities';
import { isDev } from '../utils/isEnvironment';
import { logger } from '../utils/Logger';

export class BAClient extends ShoriClient {

  private guildSettings = getRepository(GuildSettings);

  constructor(shoriOptions: ShoriOptions, clientOptions: ClientOptions) {
    super(shoriOptions, clientOptions);
  }

  public async getPrefix(id: string): Promise<string> {
    const settings = await this.guildSettings.findOne(id, { cache: Config.caching.GuildSettingsCacheDuration });
    if (!settings) {
      const newSettings = new GuildSettings({ guild: id, prefix: Config.general.prefix });
      await newSettings.save();
      return newSettings.prefix;
    }
    return settings.prefix;
  }

  public async start(): Promise<string> {
    await createConnection({
      type: 'postgres',
      url: Config.credentials.postgresql.url,
      logging: isDev(),
      synchronize: isDev(),
      entities,
    });

    if (isDev()) this.on('debug', logger.debug.bind(logger));
    return this.login(Config.credentials.discord.token);
  }
}

