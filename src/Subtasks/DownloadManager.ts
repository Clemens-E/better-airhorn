import dur from '@rocka/mp3-duration';
import { exec } from 'child_process';
import fs from 'fs';
import fetch from 'node-fetch';
import { NodeMessage, Server } from 'veza';
import { logger } from '../classes/Logger';

const srv = new Server('DownloadManager');

srv.on('connect', (client: any): void => logger.info(`${client.name} connected to ${srv.name}`));


function scan(path: string): Promise<boolean> {
    return new Promise((res): void => {
        exec(`clamscan ${path} -r --remove`, (err: any, stdout: string): void => {
            res((stdout.split('\n')[0].split(' ')[1] || '').trim() === 'OK');
        });
    });
}

function download(url: string, path: string): Promise<void> {
    return new Promise((res, rej): void => {
        fetch(url).then((r): void => {
            const fileStream = fs.createWriteStream(path);
            r.body.pipe(fileStream);
            r.body.on('error', rej);
            fileStream.on('finish', res);
        });
    });
}

srv.on('message', async (m: NodeMessage): Promise<void> => {
    if (m.data.type === 'DOWNLOAD') {
        m.reply(await download(m.data.data.url, m.data.data.path));
    } else if (m.data.type === 'SCAN') {
        m.reply(await scan(m.data.data.path));
    } else if (m.data.type === 'DURATION') {
        m.reply(await dur(m.data.data.path));
    } else if (m.data.type === 'PING') {
        m.reply('PONG');
    }
});

srv.listen()
    .then((p: Server): boolean => process.send({ type: 'READY_TO_CONNECT', data: p.server.address() }));
