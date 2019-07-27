const Lame = require('node-lame').Lame;
const fsp = require('fs').promises;
const fs = require('fs');
const promisify = require('util').promisify;
const getSize = promisify(require('get-folder-size'));
const id = require('shortid');
const keyCheck = (function () {
    const {
        hasOwnProperty,
    } = Object.prototype;
    return function (key) {
        return !hasOwnProperty.call(this, key);
    };
})();

/*
commandDefault = {
    commandName: '',
    fileName: '',
    privacyMode: 0,
    guild: '',
};
*/
class AudioStorage {

    /**
     *Creates an instance of AudioStorage.
     * @param {pg.Pool} psqlInstance pool to a psql connection
     * @param {String} dirPath Path to save the audio too.
     * @param {Number} maxSize maximal Size of the directory
     * @param {Number} [scanInterval=10 * 1000] interval to scan the directory
     * @memberof AudioStorage
     */
    constructor(psqlInstance, dirPath, maxSize, scanInterval = 10 * 1000) {
        this.db = psqlInstance;
        this.dirPath = dirPath;
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.scanInterval = scanInterval;
        this.privacyOptions = ['only send', 'only me', 'only this guild', 'everyone'];

        /*
            Each element should look like this:
            {
                id:      short-id
                started: Date.now()
                done:    boolean
            }
        */
        this.tasks = [];
        this.interval = true;
        this.acceptNewTasks = true;
    }

    /**
     *Will reject new tasks and wait until all Tasks finished, forces the shutdown after 10 Seconds
     *
     * @returns {Promise<boolean>} returns true if Tasks where closed by force
     * @memberof AudioStorage
     */
    async shutdown() {
        const timeout = promisify(setTimeout);
        let retries = 0;
        let force = false;
        this.interval = false;
        this.acceptNewTasks = false;
        while (this.tasks.length !== 0) {
            await timeout(1000);
            retries++;
            if (retries > 10) {
                force = true;
                break;
            }
        }
        await this.db.end();
        return force;
    }

    /**
     *Returns a array with all commands in the db
     *
     * @returns {Array<object>} Array filled with objects of Audio Clip infos
     * @memberof AudioStorage
     * @async
     */
    async getAudioList() {
        return (await this.db.query('SELECT * FROM files')).rows;
    }

    /**
     *Reviews a command (sets it on true)
     *
     * @param {string} commandName
     * @param {boolean} [value=true]
     * @memberof AudioStorage
     * @async
     */
    async review(commandName, value = true) {
        await this.db.query('UPDATE files SET reviewed = $1 WHERE commandName = $2 ', [value, commandName]);
    }

    /**
     *Scans the size of the dir and calls itself after x ms defined in scanInterval
     *
     * @memberof AudioStorage
     * @private
     */
    async _updateSize() {
        const size = await getSize(this.dirPath);
        // In GB
        this.currentSize = (size / 1024 / 1024 / 1024).toFixed(2);
        if (!this.interval) return;
        setTimeout(() => this._updateSize(), this.scanInterval);
    }

    /**
     *Checks if the maximum Dir Size is reached. Throws a error if the Limit is reached
     *
     * @memberof AudioStorage
     * @private
     * @throws {Error}
     */
    async _check() {
        if (this.currentSize < this.maxSize) return;
        throw new Error(`${this.dirPath} has reached its maximum size of ${this.maxSize}. Please delete files or increase maxSize`);
    }

    /**
     *returns information about a command, including privacymode, commandname, user, guild and filename.
     *
     * @param {string} commandName
     * @returns {object or undefined}
     * @memberof AudioStorage
     * @async
     */
    async getAudioInfo(commandName) {
        return (await this.db.query('SELECT * FROM files WHERE commandName = $1', [commandName])).rows[0];
    }

    /**
     *Finds and plays the commandName on the connection, resolves when finished playing
     *
     * @param {*} connection a voice channel connection
     * @param {string} commandName the commandName you want to play
     * @returns {Promise} resolves after finished playing
     * @memberof AudioStorage
     * @async
     */
    async playAudio(connection, commandName) {
        const taskID = this.addTask();
        if (!await this.nameExists(commandName)) throw new Error('command does not exist');
        const file = `${this.dirPath}/${((await this.db.query('SELECT filename FROM files WHERE commandName = $1', [commandName])).rows[0] || []).filename}`;
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
            dis.on('error', () => {
                rej();
                this.removeTask(taskID);
            });
        });
    }

    /**
     *Creates a new filename in this format: "{short-id}-{time cut in half}-shardID"
     *
     * @param {number} shardID the current shard / worker
     * @returns {string} the new filename
     * @memberof AudioStorage
     */
    getNewPath(shardID) {
        const time = Date.now().toString();
        return `${id.generate()}-${time.substring(time.length / 2, time.length)}-${shardID || 0}`;
    }

    /**
     *Checks if a name is already used in the db
     *
     * @param {string} name
     * @returns {boolean} if the name is used or not
     * @memberof AudioStorage
     * @async
     */
    async nameExists(name) {
        const names = (await this.db.query('SELECT commandName FROM files')).rows.map(x => x.commandname);
        return names.includes(name);
    }

    /**
     *Checks if a file exists and returns a {exists: boolean, birthtime:number}
     *
     * @param {string} path
     * @returns {object} property's: exists and birthtime
     * @memberof AudioStorage
     * @async
     */
    async fileExists(path) {
        const o = {
            exists: (await fsp.access(path).catch(() => false)) === undefined ? true : false,
            birthtime: 0,
        };
        if (o.exists) o.birthtime = (await fsp.stat(path)).birthtimeMs;
        return o;
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
    async addAudio(user, guild, options) {
        const taskID = this.addTask();
        const requiredProps = ['commandName', 'fileName', 'privacyMode'];
        if (requiredProps.some(keyCheck, options)) throw new TypeError('The parameter "options" is missing one or multiple property\'s');
        if (typeof options.privacyMode === 'string') options.privacyMode = this.encodePrivacyMode(options.privacyMode);

        if (options.privacyMode === -1) throw new Error('passed privacyMode is not a valid option.');
        const r = (await this.db.query('INSERT INTO files(commandName, fileName, privacyMode, guild, "user") VALUES ($1, $2, $3, $4, $5) RETURNING commandName as name',
            [options.commandName, options.fileName, options.privacyMode, guild, user])).rows[0].name;
        this.removeTask(taskID);
        return r;
    }

    /**
     *Deletes a audio row and its file
     *
     * @param {string} fileName name of the file to delete
     * @param {boolean} [deleteFle=true] if it should unlink the file
     * @memberof AudioStorage
     * @async
     */
    async deleteAudio(fileName, deleteFle = true) {
        const taskID = this.addTask();
        if (deleteFle) {
            const path = `${this.dirPath}/${fileName}`;
            const exists = (await fsp.access(path).catch(() => false)) === undefined ? true : false;
            if (!exists) throw new Error(`${fileName} does not exists`);
            await fsp.unlink(path);
        }
        await this.db.query('DELETE FROM files WHERE fileName = $1', [fileName]);
        this.removeTask(taskID);
    }

    /**
     *Returns the Description String of the Privacy Mode
     *
     * @param {number} mode
     * @returns {string}
     * @memberof AudioStorage
     */
    decodePrivacyMode(mode) {
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
    encodePrivacyMode(descriptionString) {
        return this.privacyOptions.indexOf(descriptionString);
    }

    /**
     *Adds a new Task, it should be removed after its finished
     *
     * @returns {string} the id of the task to identify the task
     * @memberof AudioStorage
     * @private
     */
    addTask() {
        if (!this.acceptNewTasks) throw new Error('process is shutting down, task was denied.');
        const time = Date.now().toString();
        const taskID = `${id.generate()}-${time.substring(time.length / 2, time.length)}`;
        this.tasks.push({
            id: taskID,
            started: Date.now(),
            done: false,
        });
        return taskID;
    }

    /**
     *Removes a Task, requires the taskID
     *
     * @param {string} taskID
     * @returns {boolean} if the task was removed
     * @memberof AudioStorage
     * @private
     */
    removeTask(taskID) {
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
     *Records and saves a file with the recorded voice of author
     *
     * @param {User} author The User to record the Audio from
     * @param {VoiceConnection} conn The Discord Connection to a voiceChannel
     * @param {String} tmpPath The path for a temporary file, will be deleted after encoding finished
     * @param {String} outputName The path for the mp3 encoded Audio
     * @param {Number} timeout After what time to stop the recording.
     * @returns {Promise} returns the path if anything worked well.
     */
    record(author, conn, tmpPath, outputName, timeout) {
        const taskID = this.addTask();
        const outputPath = `${this.dirPath}/${outputName}`;
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
                    bitrate: 192,
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
module.exports = AudioStorage;