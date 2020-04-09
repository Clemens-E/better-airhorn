import { spawn } from 'child_process';
import { Service } from 'shori';
import { Readable } from 'stream';
/**
 * This Service provides basic methods to convert streams
 *
 * @class StreamConversionService
 */
@Service()
export class StreamConversionService {

  public convertStreamToMP3(stream: Readable): Promise<Readable> {
    return new Promise((res, rej) => {
      const child = spawn('ffmpeg', '-i pipe:0 -vn -ar 44100 -ac 2 -b:a 192k -map_metadata -1 -f mp3 pipe:1'.split(' '));
      child.once('error', rej);
      child.stdout.once('readable', () => res(child.stdout));
      stream.pipe(child.stdin);
    });
  }

}
