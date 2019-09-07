import { User, VoiceConnection } from 'discord.js';
import pg from 'pg';

import { AudioCommand } from '../models/AudioCommand';
import { logger } from './Logger';
import MP3Manager from './MP3Manager';
import SimilarityHandler from './SimilarityHandler';
import TaskHandler from './TaskManager';


export default class AudioStorage extends TaskHandler {
    private pool: pg.Pool;
    private mp3: MP3Manager;
    public similarity: SimilarityHandler;
    public readonly privacyOptions: string[];

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
        this.checkFiles();
    }

    /**
     *Will reject new Tasks and wait until all Tasks finished.
     *It will force a shutdown after 10 Seconds
     *
     * @returns {Promise<void>}
     * @memberof AudioStorage
     */
    public async shutdown(): Promise<void> {
        await this.drainTasks();
        await this.mp3.shutdown();
        await this.pool.end();
    }

    public async checkFiles(): Promise<void> {
        const commands = await this.fetchAll();
        const exists = await Promise.all(commands.map((x): Promise<boolean> => this.mp3.exists(x.filename)));
        const dontExist = exists.filter((x): boolean => !x).length;
        if (dontExist > (commands.length * (2 / 100))) {
            logger.error(`${dontExist} AUDIOFILES ARE MISSING`);
            if (process.env.NODE_ENV === 'production') {
                logger.error('THIS IS PRODUCTION; SHUTTING DOWN');
                process.exit(1);
            }
        } else if (dontExist > 0) {
            logger.warn(`${dontExist} AUDIO FILES ARE MISSING`);
        }
    }

    /**
     *Array of all AudioCommands
     *
     * @returns {Promise<AudioCommand[]>}
     * @memberof AudioStorage
     */
    public async fetchAll(options?: { includeVotes?: boolean; user?: string; guild?: string }): Promise<AudioCommand[]> {
        if (options && options.user && options.guild) throw new Error('option "user" and "guild" can\'t be defined at the same time');

        let res: AudioCommand[];
        if (options && options.user) {
            res = (await this.pool.query('SELECT * FROM files WHERE "user"=$1', [options.user])).rows;
        } else if (options && options.guild) {
            res = (await this.pool.query('SELECT * FROM files WHERE privacymode=3 AND guild=$1', [options.guild])).rows;
        } else {
            res = (await this.pool.query('SELECT * FROM files')).rows;
        }

        if (options && options.includeVotes) {
            const upvotes = (await this.pool.query('SELECT count(\'\'), command FROM votes WHERE upvote=true GROUP BY command')).rows;
            const downvotes = (await this.pool.query('SELECT count(\'\'), command FROM votes WHERE upvote=false GROUP BY command')).rows;
            return res.map((r: AudioCommand) => {
                r.upvotes = parseInt((upvotes.find(x => x.command === r.commandname) || { count: 0 }).count);
                r.downvotes = parseInt((downvotes.find(x => x.command === r.commandname) || { count: 0 }).count);
                return r;
            });
        }
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
    public async review(commandName: string, value = true): Promise<void> {
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
        await this.mp3.readStream(connection, file);
        this.removeTask(taskID);
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
        const names = (await this.pool.query('SELECT commandName FROM files')).rows.map((x): string => x.commandname);
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
    public async add(command: AudioCommand): Promise<string> {
        const taskID = this.addTask();
        const r = (await this.pool.query('INSERT INTO files(commandName, fileName, privacyMode, guild, "user") VALUES ($1, $2, $3, $4, $5) RETURNING commandName as name',
            [command.commandname, command.filename, command.privacymode, command.guild, command.user])).rows[0].name;
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
    public async delete(fileName: string, deleteFile = true): Promise<void> {
        const taskID = this.addTask();
        if (deleteFile) {
            await this.mp3.delete(fileName);
        }

        const name = await this.pool.query('DELETE FROM files WHERE fileName = $1 RETURNING commandname', [fileName]);
        this.similarity.remove(name.rows[0].commandname);
        this.removeTask(taskID);
    }

    public async upvote(user: string, commandName: string): Promise<void> {
        await this.pool.query('INSERT INTO votes("user", command, time, upvote) VALUES($1, $2, $3, $4)', [user, commandName, Date.now(), true]);
    }

    public async downvote(user: string, commandName: string): Promise<void> {
        await this.pool.query('INSERT INTO votes("user", command, time, upvote) VALUES($1, $2, $3, $4)', [user, commandName, Date.now(), false]);
    }

    /**
     *Returns information about a command, including privacymode, commandname, user, guild and filename.
     *
     * @param {string} commandName
     * @returns {Promise<AudioCommand>}
     * @memberof AudioStorage
     * @async
     */
    public async fetch(commandName: string): Promise<AudioCommand> {
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
     * @returns {Promise} returns the path if everything worked well.
     */
    public async record(author: User, conn: VoiceConnection, timeout: number): Promise<string> {
        const taskID = this.addTask();
        const stream = conn.receiver.createStream(author, {
            end: 'manual',
            mode: 'pcm',
        });
        setTimeout((): void => stream.destroy(), timeout);
        const res = await this.mp3.savePCM(stream);
        this.removeTask(taskID);
        return res;
    }
}
