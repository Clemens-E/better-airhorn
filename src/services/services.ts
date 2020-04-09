import { FileCachingService } from './FileCachingService';
import { MinIOService } from './MinIOService';
import { SoundCommandService } from './SoundCommandService';
import { SoundFilesManager } from './SoundFilesManager';
import { StatisticsService } from './StatisticsService';
import { StreamConversionService } from './StreamConversionService';


/**
 * List of Service that need to be registered
 */
export const services = [FileCachingService, MinIOService, SoundCommandService, SoundFilesManager, StatisticsService, StreamConversionService];
