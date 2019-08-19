import id from 'cuid';
import { VoiceConnection } from 'discord.js';
import fs from 'fs';
import { Lame } from 'node-lame';
import readdir from 'readdirp';
import { Readable } from 'stream';

import { Config } from '../../configs/generalConfig';
import FileSystemUtils from './FileSystemUtils';
import TaskHandler from './TaskManager';
import DownloadHandler from './DownloadHandler';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config.js');

export default class MP3Manager extends TaskHandler {
    private readonly storage: string;
    private readonly scanInterval: number;
    private shutdown: boolean;
    private removedFiles: number;
    private downloader: DownloadHandler;

    public constructor(storage: string, scanInterval = 60 * 1000) {
        super();
        this.storage = storage;
        this.scanInterval = scanInterval;
        this.removedFiles = 0;
        this.downloader = new DownloadHandler();
        FileSystemUtils.ensureDir(this.storage).then((): void =>
            this.scanStorage());
    }

    public get RemovedFiles(): number { return this.removedFiles; }

    /**
     *Removes old temporary files
     *
     * @private
     * @memberof AudioStorage
     */
    private scanStorage(): void {
        readdir(this.storage, {
            fileFilter: '*.tmp',
        })
            .on('data', (e: any): void => {
                const parsedDate = e.basename.split('.')[0];
                if (+parsedDate < (Date.now() - 5 * 60 * 1000)) {
                    FileSystemUtils.delete(e.fullPath);
                    this.removedFiles++;
                }
            })
            .on('end', (): void => {
                setTimeout((): void => this.scanStorage(), this.scanInterval);
            });
    }


    protected newFilename(tmp = false, shard = 0): string {
        if (tmp) {
            const time = Date.now().toString();
            return `${id()}.${time}.tmp`;
        }
        return `${id()}.${shard}.mp3`;
    }

    public delete(filename: string): Promise<void> | void {
        return FileSystemUtils.delete(`${this.storage}/${filename}`, true);
    }

    public writeStream(stream: Readable, timeout: number): Promise<string> {
        const file = this.newFilename();
        const tmp = this.newFilename(true);
        const writeStream = fs.createWriteStream(`${this.storage}/${tmp}`);
        const taskID = this.addTask('converting stream');

        return new Promise((res): void => {
            stream.on('close', (): void => writeStream.end());
            stream.pipe(writeStream);
            setTimeout((): void => stream.destroy(), timeout);
            writeStream.on('close', async (): Promise<void> => {
                const encoder = new Lame({
                    output: `${this.storage}/${file}`,
                    bitrate: config.audio.bitrate,
                    raw: true,
                }).setFile(tmp);
                await encoder.encode();
                await fs.promises.unlink(tmp);
                res(file);
                this.removeTask(taskID);
            });
        });
    }

    public readStream(connection: VoiceConnection, file: string): Promise<void> {
        const readStream = fs.createReadStream(`${this.storage}/${file}`);
        const task = this.addTask('reading stream');

        return new Promise((res, rej): void => {
            const dispatcher = connection.play(readStream);
            const resolveIT = (): void => {
                res();
                this.removeTask(task);
            };
            dispatcher.on('close', resolveIT);
            dispatcher.on('end', resolveIT);
            dispatcher.on('error', (e: any): void => {
                rej(e);
                this.removeTask(task);
            });
        });
    }
}
