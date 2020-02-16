import SizeParser from 'filesize-parser';
import {normalize} from 'path';
export const Config = {

  colors: {
    error: '9D344B',
    warn: 'AA6039',
    neutral: '257059',
    success: '549431',
  },

  audio: {
    bitrate: 144,
    storage: normalize(`${process.cwd()}/storage`),
    musicFolder: normalize(`${process.cwd()}/music`),
    maxRecordTime: 20,
    maxFileSize: SizeParser('15MB'),
    maxFolderSize: SizeParser('100GB'),
  },

  emojis: {
    loading: '<a:BE_loading:505378765950550036>',
    updating: '<a:BE_updating:505372749846544385>',
    done: '<a:BE_YES:513771657383378973>',
    empty: '<:empty:604779509568241684>',
    crashed: '<:crashed:589476154201866243>',
    offline: '<:offline:596443669280587776>',
    online: '<:online:596442525636624409>',
    import: '622185134900248578',
  },

  general: {
    ownerID: '196214245770133504',
    prefix: '$',
    voteURL: 'https://webhooks.chilo.space/better-airhorn',
    subTasks: normalize(`${__dirname}/../src/Subtasks`),
    supportServer: 'https://discord.gg/5bfhkJ3',
    statusPage: 'https://chilo.space/service/better-airhorn',
  },
};
