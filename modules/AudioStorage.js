const Lame = require('node-lame').Lame;
const fsp = require('fs').promises;
const fs = require('fs');
const getSize = require('util').promisify(require('get-folder-size'));
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
     * @param {Number} maxSize
     * @param {Number} [scanInterval=10 * 1000]
     * @memberof AudioStorage
     */
    constructor(psqlInstance, dirPath, maxSize, scanInterval = 10 * 1000) {
        this.db = psqlInstance;
        this.dirPath = dirPath;
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.scanInterval = scanInterval;
        this.privacyOptions = ['only send', 'only me', 'only this guild', 'everyone'];
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
     *finds and plays the commandName on the connection, resolves when finished playing
     *
     * @param {*} connection a voice channel connection
     * @param {*} commandName the commandName you want to play
     * @returns {Promise} resolves after finished playing
     * @memberof AudioStorage
     */
    async playAudio(connection, commandName) {
        if (!await this.nameExists(commandName)) throw new Error('command does not exist');
        const file = `${this.dirPath}/${
            ((await this.db.query('SELECT filename FROM files WHERE commandName = $1', [commandName])).rows[0] || []).filename}`;
        if (!await this.fileExists(file)) throw new Error(`can not find file  ${file}`);
        return new Promise((res, rej) => {
            console.log(file);
            const dis = connection.play(file, {
                volume: 1,
            });
            dis.on('end', res);
            dis.on('error', rej);
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
        const path = `${id.generate()}-${time.substring(time.length / 2, time.length)}-${shardID || 0}`;
        return path;
    }

    /**
     *Checks if a name is already used in the db
     *
     * @param {string} name
     * @returns {boolean} if the name is used or not
     * @memberof AudioStorage
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
     */
    async addAudio(user, guild, options) {
        const requiredProps = ['commandName', 'fileName', 'privacyMode'];
        if (requiredProps.some(keyCheck, options)) throw new TypeError('The parameter "options" is missing one or multiple property\'s');
        if (typeof options.privacyMode === 'string') options.privacyMode = this.encodePrivacyMode(options.privacyMode);

        if (options.privacyMode === -1) throw new Error('passed privacyMode is not a valid option.');
        return (await this.db.query('INSERT INTO files(commandName, fileName, privacyMode, guild, "user") VALUES ($1, $2, $3, $4, $5) RETURNING commandName as name',
            [options.commandName, options.fileName, options.privacyMode, guild, user])).rows[0].name;
    }

    /**
     *Deletes a audio row and its file
     *
     * @param {string} fileName name of the file to delete
     * @param {boolean} [deleteFle=true] if it should unlink the file
     * @memberof AudioStorage
     */
    async deleteAudio(fileName, deleteFle = true) {
        if (deleteFle) {
            const path = `
        $ {
            this.dirPath
        }
        /${fileName}`;
            const exists = (await fsp.access(path).catch(() => false)) === undefined ? true : false;
            if (!exists) throw new Error(`${fileName} does not exists`);
            await fsp.unlink(path);
        }
        await this.db.query('DELETE * FROM files WHERE fileName = $1', [fileName]);
    }

    /**
     *Returns the Description String of the Privacy Mode
     *
     * @param {Number} mode
     * @returns {String}
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
     *records and saves a file with the recorded voice of author
     *
     * @param {User} author The User to record the Audio from
     * @param {VoiceConnection} conn The Discord Connection to a voiceChannel
     * @param {String} tmpPath The path for a temporary file, will be deleted after encoding finished
     * @param {String} outputName The path for the mp3 encoded Audio
     * @param {Number} timeout After what time to stop the recording.
     */
    record(author, conn, tmpPath, outputName, timeout) {
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
            });
        });
    }

}
module.exports = AudioStorage;