import { Lame } from 'node-lame';
import { promises as fsp } from 'fs';
import { Task } from '../struct/Task';
import { AudioCommand } from '../struct/AudioCommand';
import { VoiceConnection, User } from 'discord.js';
import { promisify } from 'util';
import { Config } from '../../configs/generalConfig';
import fs from 'fs';
import id from 'cuid';
import pg from 'pg';
import getSize from 'get-folder-size';

const config: Config = require('../../configs/config.js');

export default class AudioStorage {
    private pool: pg.Pool;
    private tasks: Task[];

    private dir: string;

    private maxDirSize: number;
    private scanInterval: number;
    // In MB
    private currentSize: number;

    private interval: boolean;
    private acceptNewTasks: boolean;

    readonly privacyOptions: string[];

    /**
     *Creates an instance of AudioStorage.
     * @param {pg.Pool} pool PostgreSQL Pool
     * @param {string} dir Path to save audio to
     * @param {number} maxSize maximal Size of the directory in MegaByte
     * @param {number} [scanInterval=10 * 1000] interval to scan the directory's size
     * @memberof AudioStorage
     */
    constructor(pool: pg.Pool, dir: string, maxSize: number, scanInterval: number = 10 * 1000) {
        this.maxDirSize = maxSize;
        this.scanInterval = scanInterval;
        this.pool = pool;

        this.tasks = [];
        this.interval = true;
        this.acceptNewTasks = true;
        this.currentSize = 0;
        this.privacyOptions = ['only send', 'only me', 'only this guild', 'everyone'];
    }

    /**
     *Will reject new Tasks and wait until all Tasks finished.
     *It will force a shutdown after 10 Seconds
     *
     * @returns {Promise<boolean>}
     * @memberof AudioStorage
     */
    public async shutdown(): Promise<boolean> {
        const timeout = promisify(setTimeout);
        let retries = 0;
        let force = false;
        this.interval = false;
        this.acceptNewTasks = false;
        while (this.tasks.length !== 0) {
            await timeout(100);
            retries++;
            if (retries > 100) {
                force = true;
                break;
            }
        }
        await this.pool.end();
        return force;
    }

    /**
     *Array of all AudioCommands
     *
     * @returns {Promise<AudioCommand[]>}
     * @memberof AudioStorage
     */
    public async getAudioList(): Promise<AudioCommand[]> {
        return (await this.pool.query('SELECT * FROM files')).rows;
    }

    /**
     *Reviews a AudioCommand (sets it to true/false)
     *
     * @param {string} commandName
     * @param {boolean} [value=true]
     * @returns {Promise<void>}
     * @memberof AudioStorage
     */
    public async review(commandName: string, value: boolean = true): Promise<void> {
        await this.pool.query('UPDATE files SET reviewed = $1 WHERE commandName = $2 ', [value, commandName]);
    }

    /**
     *Updates currentSize
     *
     * @private
     * @memberof AudioStorage
     */
    private updateSize(): void {
        const size = getSize(this.dir, (_err, size) => {
            this.currentSize = +(size / 1024 / 1024 / 1024).toFixed(2);
            if (!this.interval) return;
            setTimeout(() => this.updateSize(), this.scanInterval);
        });
    }

    /**
     *Throws an Error if the maximum dir Size is reached
     *
     * @private
     * @returns
     * @memberof AudioStorage
     * @throws {Error}
     */
    private check(): void {
        if (this.currentSize < this.maxDirSize) return;
        throw new Error(`${this.dir} has reached its maximum size of ${this.maxDirSize}. Please delete files or increase maxSize`);
    }

    /**
     *Returns information about a AudioCommand, including privacymode, commandname, user, guild and filename.
     *
     * @param {string} commandName
     * @returns
     * @memberof AudioStorage
     */
    public async getAudioInfo(commandName: string): Promise<AudioCommand> {
        return (await this.pool.query('SELECT * FROM files WHERE commandName = $1', [commandName])).rows[0];
    }

    /**
     *Checks if a file exists and returns a {exists: boolean, birthtime:number}
     *
     * @param {string} path
     * @returns {object} property's: exists and birthtime
     * @memberof AudioStorage
     */
    async fileExists(path: string): Promise<any> {
        const o = {
            exists: (await fsp.access(path).catch(() => false)) === undefined ? true : false,
            birthtime: 0,
        };
        if (o.exists) o.birthtime = (await fsp.stat(path)).birthtimeMs;
        return o;
    }

    /**
     *Adds a new Task, it should be removed after its finished
     *
     * @returns {string} the id of the task to identify the task
     * @memberof AudioStorage
     * @private
     */
    addTask(): string {
        if (!this.acceptNewTasks) throw new Error('task was denied');
        const time = Date.now().toString();
        const taskID = `${id()}-${time.substring(time.length / 2, time.length)}`;
        this.tasks.push({
            description: '',
            id: taskID,
            started: Date.now(),
            done: false,
        });
        return taskID;
    }

    /**
     *Removes a Task, requires the taskID
     *
     *  @param {string} taskID
     * @returns {boolean} if the task was removed
     * @memberof AudioStorage
     * @private
     */
    removeTask(taskID: string) {
        for (let index = 0; index < this.tasks.length; index++) {
            const element = this.tasks[index];
            if (element.id === taskID) {
                this.tasks[index].done = true;
                this.tasks.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    /**
     *Finds and plays the commandName on the connection, resolves when finished playing
     *
     * @param {VoiceConnection} connection
     * @param {string} commandName
     * @returns {Promise<void>}
     * @memberof AudioStorage
     */
    async playAudio(connection: VoiceConnection, commandName: string): Promise<void> {
        const taskID = this.addTask();
        if (!await this.nameExists(commandName)) throw new Error('command does not exist');
        const file = `${this.dir}/${((await this.pool.query('SELECT filename FROM files WHERE commandName = $1', [commandName])).rows[0] || []).filename}`;
        if (!(await this.fileExists(file)).exists) throw new Error(`${file} does not exists`);
        return new Promise((res, rej) => {
            const dis = connection.play(file, {
                volume: 1,
            });
            const resolveIT = () => {
                res();
                this.removeTask(taskID);
            };
            dis.on('close', resolveIT);
            dis.on('end', resolveIT);
            dis.on('error', e => {
                rej(e);
                this.removeTask(taskID);
            });
        });
    }

    /**
     *Checks if a name is already used in the db
     *
     * @param {string} name
     * @returns {boolean} if the name is used or not
     * @memberof AudioStorage
     * @async
     */
    async nameExists(name: string): Promise<boolean> {
        const names = (await this.pool.query('SELECT commandName FROM files')).rows.map(x => x.commandname);
        return names.includes(name);
    }

    /**
     *Adds a a Audio to the db
     *
     * @param {string} user id of the audio owner
     * @param {string} guild id of the guild the clip was recorded in
     * @param {object} options has to include "commandName", "fileName", "privacyMode"
     * @returns {string} commandName
     * @memberof AudioStorage
     * @async
     */
    async addAudio(user: any, guild: any, options: { privacyMode: 0 | 1 | 2 | 3; commandName: string; fileName: any; }) {
        const taskID = this.addTask();
        const r = (await this.pool.query('INSERT INTO files(commandName, fileName, privacyMode, guild, "user") VALUES ($1, $2, $3, $4, $5) RETURNING commandName as name',
            [options.commandName, options.fileName, options.privacyMode, guild, user])).rows[0].name;
        this.removeTask(taskID);
        return r;
    }

    /**
     *Deletes an Audio row and its file
     *
     * @param {string} fileName
     * @param {boolean} [deleteFile=true]
     * @returns {Promise<void>}
     * @memberof AudioStorage
     */
    async deleteAudio(fileName: string, deleteFile: boolean = true): Promise<void> {
        const taskID = this.addTask();
        if (deleteFile) {
            const path = `${this.dir}/${fileName}`;
            const exists = (await fsp.access(path).catch(() => false)) === undefined ? true : false;
            if (!exists) throw new Error(`${fileName} does not exists`);
            await fsp.unlink(path);
        }
        await this.pool.query('DELETE FROM files WHERE fileName = $1', [fileName]);
        this.removeTask(taskID);
    }

    /**
     *Returns information about a command, including privacymode, commandname, user, guild and filename.
     *
     * @param {string} commandName
     * @returns {Promise<AudioCommand>}
     * @memberof AudioStorage
     * @async
     */
    async getAudioCommand(commandName: string): Promise<AudioCommand> {
        return (await this.pool.query('SELECT * FROM files WHERE commandName = $1', [commandName])).rows[0];
    }

    /**
     *Creates a new filename
     *
     * @param {string} [shardID='0']
     * @returns {string}
     * @memberof AudioStorage
     */
    getNewPath(shardID: string = '0'): string {
        const time = Date.now().toString();
        return `${id()}-${shardID}`;
    }

    /**
     *Returns the Description String of the Privacy Mode
     *
     * @param {number} mode
     * @returns {string}
     * @memberof AudioStorage
     */
    decodePrivacyMode(mode: number): string {
        if (mode > this.privacyOptions.length || mode < 0) throw new RangeError(`Argument is out of Range (0 - ${this.privacyOptions.length})`);
        return this.privacyOptions[mode];
    }

    /**
     *Returns the PrivacyMode of the Description String
     *
     * @param {String} descriptionString
     * @returns {Number}
     * @memberof AudioStorage
     */
    encodePrivacyMode(descriptionString: string): number {
        return this.privacyOptions.indexOf(descriptionString);
    }

    /**
     *Records and saves a file with the recorded voice of author
     *
     * @param {User} author The User to record the Audio from
     * @param {VoiceConnection} conn The Discord Connection to a voiceChannel
     * @param {string} tmpPath The path for a temporary file, will be deleted after encoding finished
     * @param {string} outputName The path for the mp3 encoded Audio
     * @param {Number} timeout After what time to stop the recording.
     * @returns {Promise} returns the path if anything worked well.
     */
    record(author: User, conn: VoiceConnection, tmpPath: string, outputName: string, timeout: number) {
        const taskID = this.addTask();
        const outputPath = `${this.dir}/${outputName}`;
        return new Promise((res) => {
            const stream = conn.receiver.createStream(author, {
                end: 'manual',
                mode: 'pcm',
            });
            stream.on('close', () => writeStream.end());
            const writeStream = fs.createWriteStream(tmpPath);
            stream.pipe(writeStream);
            setTimeout(() => stream.destroy(), timeout);
            writeStream.on('close', async () => {
                conn.disconnect();
                const encoder = new Lame({
                    output: outputPath,
                    bitrate: config.audio.bitrate,
                    raw: true,
                }).setFile(tmpPath);
                await encoder.encode();
                await fsp.unlink(tmpPath);
                res(outputPath);
                this.removeTask(taskID);
            });
        });
    }
}