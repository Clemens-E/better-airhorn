import {User, VoiceConnection} from 'discord.js';
import {Service} from 'shori';
import {Readable} from 'stream';
import {SoundFilesManager} from './SoundFilesManager';
import {StreamConversionService} from './StreamConversionService';

/**
 * This Service provides an interface to the complex methods like play, record, download of files
 * TODO: CE: ADD LOCKING WITH REDLOCK TO PREVENT SIMULTANEOUS PLAYING/RECORDING IN A GUID
 *
 * @class SoundCommandService
 */
@Service()
export class SoundCommandService {

  constructor(
    private filesManager: SoundFilesManager,
    private conversionService: StreamConversionService,
  ) { }

  /**
   * play a soundfile in a voice channel
   *
   * @param id id of the soundfile
   * @param connection the voice connection
   */
  public async play(id: number, connection: VoiceConnection): Promise<void> {
    const stream = await this.filesManager.get(id);
    const dispatcher = connection.play(stream as Readable, { type: 'unknown' });
    return new Promise((res, rej) => {
      dispatcher
        .on('finish', res)
        .on('error', rej);
    });
  }


  /**
   * Create a voice stream for a user and store the resulting stream as mp3 in minio
   * FIXME: CE: PLAY DING.WAV TO RECEIVE AUDIO FROM DISCORD
   *
   * @param user the user that should be recorded
   * @param connection
   * @param id the file id for the minio server
   * @param timeout after what time to stop recording*
   * @returns promise that resolves as soon as the file is stored in minio
   */
  public async record(user: User, connection: VoiceConnection, id: number, timeout: number): Promise<void> {
    const stream = connection.receiver.createStream(user, { end: 'manual', mode: 'pcm' });
    setTimeout(stream.destroy.bind(stream), timeout);
    const mp3Stream = await this.conversionService.convertStreamToMP3(stream);
    await this.filesManager.set(id, mp3Stream);
  }

}
