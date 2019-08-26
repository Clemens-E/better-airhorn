import { User, VoiceConnection } from 'discord.js';
import pg from 'pg';

import AudioCommand from '../models/AudioCommand';
import MP3Manager from './MP3Manager';
import TaskHandler from './TaskManager';
import SimilarityHandler from './SimilarityHandler';


export default class AudioStorage extends TaskHandler {
    private pool: pg.Pool;
    private mp3: MP3Manager;
    private similarity: SimilarityHandler;
    private readonly privacyOptions: string[];

    /**
     *Creates an instance of AudioStorage.
     * @param {pg.Pool} pool PostgreSQL Pool
     * @param {string} dir Path to save audio to
     * @param {number} maxSize maximal Size of the directory in MegaByte
     * @param {number} [scanInterval=10 * 1000] interval to scan the directory's size
     * @memberof AudioStorage
     */
    public constructor(pool: pg.Pool, dir: string) {
        super();
        this.mp3 = new MP3Manager(dir);
        this.similarity = new SimilarityHandler();
        this.pool = pool;
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
        const force = await this.drainTasks();
        await this.pool.end();
        return force;
    }

    /**
     *Array of all AudioCommands
     *
     * @returns {Promise<AudioCommand[]>}
     * @memberof AudioStorage
     */
    public async fetchAudioList(): Promise<AudioCommand[]> {
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
     *Finds and plays the commandName on the connection, resolves when finished playing
     *
     * @param {VoiceConnection} connection
     * @param {string} commandName
     * @returns {Promise<void>}
     * @memberof AudioStorage
     */
    public async play(connection: VoiceConnection, commandName: string): Promise<void> {
        const taskID = this.addTask();
        if (!await this.nameExists(commandName)) throw new Error('command does not exist');
        const file = ((await this.pool.query('SELECT filename FROM files WHERE commandName = $1', [commandName])).rows[0] || []).filename;
        return this.mp3.readStream(connection, file);
    }

    /**
     *Checks if a name is already used in the db
     *
     * @param {string} name
     * @returns {boolean} if the name is used or not
     * @memberof AudioStorage
     * @async
     */
    public async nameExists(name: string): Promise<boolean> {
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
    public async addAudio(user: any, guild: any, options: { privacyMode: 0 | 1 | 2 | 3; commandName: string; fileName: any }): Promise<string> {
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
    public async deleteAudio(fileName: string, deleteFile: boolean = true): Promise<void> {
        const taskID = this.addTask();
        if (deleteFile) {
            await this.mp3.delete(fileName);
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
    public async fetchAudio(commandName: string): Promise<AudioCommand> {
        return (await this.pool.query('SELECT * FROM files WHERE commandName = $1', [commandName])).rows[0];
    }

    /**
     *Returns the Description String of the Privacy Mode
     *
     * @param {number} mode
     * @returns {string}
     * @memberof AudioStorage
     */
    public decodePrivacyMode(mode: number): string {
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
    public encodePrivacyMode(descriptionString: string): number {
        return this.privacyOptions.indexOf(descriptionString);
    }

    /**
     *Records and saves a file with the recorded voice of author
     *
     * @param {User} author The User to record the Audio from
     * @param {VoiceConnection} conn The Discord Connection to a voiceChannel
     * @param {Number} timeout After what time to stop the recording.
     * @returns {Promise} returns the path if anything worked well.
     */
    public record(author: User, conn: VoiceConnection, timeout: number): Promise<void> {
        const taskID = this.addTask();
        return new Promise((res): void => {
            const stream = conn.receiver.createStream(author, {
                end: 'manual',
                mode: 'pcm',
            });
            this.mp3.writeStream(stream, timeout).then((): void => {
                this.removeTask(taskID);
                res();
            });
        });
    }
}
