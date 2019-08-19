/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const sizeParser = require('filesize-parser');
module.exports = {

    colors: {
        error: '9D344B',
        warn: 'AA6039',
        neutral: '257059',
        success: '549431',
    },

    audio: {
        bitrate: 320,
        storage: path.normalize(`${__dirname}/../storage`),
        maxRecordTime: 20,
        maxFileSize: sizeParser('50MB'),
        maxFolderSize: sizeParser('100GB'),
    },

    emojis: {
        loading: '<a:BE_loading:505378765950550036>',
        updating: '<a:BE_updating:505372749846544385>',
        done: '<a:BE_YES:513771657383378973>',
        empty: '<:empty:604779509568241684>',
        crashed: '<:crashed:589476154201866243>',
    },

    general: {
        ownerID: '196214245770133504',
        prefix: '$',
        voteURL: 'https://webhooks.chilo.space/better-airhorn',
        subTasks: path.normalize(`${__dirname}/../src/Subtasks`),
    },
};