import id from 'cuid';
import { VoiceConnection } from 'discord.js';
import fs from 'fs';
import { Lame } from 'node-lame';
import readdir from 'readdirp';
import { Readable } from 'stream';

import { Config } from '../../configs/generalConfig';
import DownloadHandler from './DownloadHandler';
import FileSystemUtils from './FileSystemUtils';
import TaskHandler from './TaskManager';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config.js');

export default class MP3Manager extends TaskHandler {
    private readonly storage: string;
    private readonly scanInterval: number;
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

    public shutdown(): Promise<boolean> {
        return this.drainTasks();
    }
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
            return `${id()}.${time}`;
        }
        return `${id()}.${shard}`;
    }

    public delete(filename: string): Promise<void> | void {
        return FileSystemUtils.delete(`${this.storage}/${filename}`, true);
    }

    public savePCM(stream: Readable): Promise<string> {
        const taskID = this.addTask('converting stream');
        const file = `${this.storage}/${this.newFilename()}.mp3`;
        const tmp = `${this.storage}/${this.newFilename(true)}.tmp`;
        const writeStream = fs.createWriteStream(tmp);
        stream.pipe(writeStream);
        stream.on('close', (): void => writeStream.close());
        return new Promise((res): void => {
            writeStream.on('close', async (): Promise<void> => {
                await this.convertPCMToMP3(tmp, file);
                await FileSystemUtils.delete(tmp, true);
                res(file);
                this.removeTask(taskID);
            });
        });
    }

    public async save(url: string): Promise<string> {
        const taskID = this.addTask('converting stream');
        const file = `${this.storage}/${this.newFilename()}.mp3`;
        const tmp = `${this.storage}/${this.newFilename(true)}.tmp`;
        const tmp2 = `${this.storage}/${this.newFilename(true)}.tmp`;
        /*
        * PCM => MP3 => PCM
        * This is pure Genius
        */
        await this.downloader.download(url, tmp);
        await this.convertMP3ToPCM(tmp, tmp2);
        await this.convertPCMToMP3(tmp2, file);
        await FileSystemUtils.delete(tmp2, true);
        await FileSystemUtils.delete(tmp, true);
        this.removeTask(taskID);
        return file;
    }

    public async convertPCMToMP3(inputFile: string, outputFile: string): Promise<void> {
        const taskID = this.addTask('converting file');
        const encoder = new Lame({ output: outputFile, bitrate: config.audio.bitrate, raw: true, meta: {} }).setFile(inputFile);
        await encoder.encode();
        this.removeTask(taskID);
    }

    public convertMP3ToPCM(inputFile: string, outputFile: string): Promise<void> {
        // ! Doesn't Work!
        throw new Error('Method not implemented.');
    }

    public readStream(connection: VoiceConnection, file: string): Promise<void> {
        const task = this.addTask('reading stream');
        const readStream = fs.createReadStream(`${this.storage}/${file}`);

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
