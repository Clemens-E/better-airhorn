import { Service } from 'shori';
import { Stream } from 'stream';
import { FileCachingService } from './FileCachingService';
import { MinIOService } from './MinIOService';

/**
 * This Service provides the higher abstractions, it handles caching and directly requesting file from MinIO
 * If a file is available in the cache, it will create a stream on it, if it isnt, it will request it from MinIO
 * and create a cache of it
 *
 * @class SoundFilesManager
 */
@Service()
export class SoundFilesManager {

  constructor(
    private fileCache: FileCachingService,
    private minIO: MinIOService,
  ) { }

  public async get(id: number): Promise<Stream> {
    try {
      return await this.fileCache.get(id.toString());
    } catch (e) {
      const stream = await this.minIO.get(id.toString());
      await this.fileCache.set(id.toString(), stream);
      return stream;
    }
  }

  public set(id: number, stream: Stream): Promise<string> {
    return this.minIO.add(id.toString(), stream);
  }

  public delete(id: number): Promise<[void, void]> {
    return Promise.all([this.minIO.delete(id.toString()), this.fileCache.delete(id.toString())]);
  }
}
