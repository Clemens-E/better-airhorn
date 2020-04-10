import { ClientOptions } from 'discord.js';
import { ShoriClient, ShoriOptions } from 'shori';
import { getRepository } from 'typeorm';
import { Config } from '../config/Config';
import { GuildSettings } from '../entities/GuildSettings';

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

}

