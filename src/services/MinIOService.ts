import { Client } from 'minio';
import { Service } from 'shori';
import { Stream } from 'stream';
import { Config } from '../config/Config';
import { isProd } from '../utils/isEnvironment';

/**
 * This Service provides basic actions against the MinIO Server
 *
 * @class MinIOService
 */
@Service()
export class MinIOService {

  private client: Client;
  private bucketName: string;

  constructor() {
    this.client = new Client({
      endPoint: Config.credentials.minio.url,
      port: 9000,
      useSSL: isProd(),
      accessKey: Config.credentials.minio.accessKey,
      secretKey: Config.credentials.minio.secretKey,
    });
    this.bucketName = Config.files.minIOBucketName;
  }

  public async init(): Promise<void> {
    await this.client.bucketExists(this.bucketName)
      .then(exists => {
        if (!exists) {
          return this.client.makeBucket(this.bucketName, 'us-east-1');
        }
      });
  }

  public add(name: string, stream: Stream): Promise<string> {
    return this.client.putObject(this.bucketName, name, stream);
  }

  public get(name: string): Promise<Stream> {
    return this.client.getObject(this.bucketName, name);
  }

  public delete(name: string): Promise<void> {
    return this.client.removeObject(this.bucketName, name);
  }

}
