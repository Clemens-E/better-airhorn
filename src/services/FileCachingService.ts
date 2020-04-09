import { createReadStream, createWriteStream, promises } from 'fs';
import { join } from 'path';
import { Observable } from 'rxjs';
import { Service } from 'shori';
import { Stream } from 'stream';
import { Config } from '../config/Config';
import { MinIOService } from './MinIOService';

/**
 * This Service provides methods to access the local file cache
 *
 * @class FileCachingService
 */
@Service()
export class FileCachingService {

  private queue = new Map<number, Observable<void>>();

  constructor(
    private fileService: MinIOService,
  ) { }

  public getFullPath(otherPart: string): string {
    return join(Config.files.cacheDirectory, otherPart);
  }

  public async get(id: string): Promise<Stream> {
    const fullPath = this.getFullPath(id.toString());
    await promises.access(fullPath);
    return createReadStream(fullPath);
  }

  public set(id: string, stream: Stream): Promise<void> {
    return new Promise((res) => {
      stream.pipe(createWriteStream(this.getFullPath(id.toString())))
        .on('close', res);
    });
  }

  public delete(id: string): Promise<void> {
    const fullPath = this.getFullPath(id.toString());
    return promises.unlink(fullPath);
  }

}
