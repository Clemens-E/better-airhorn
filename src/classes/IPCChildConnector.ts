import { ChildProcess, fork } from 'child_process';
import { Client, ClientSocketStatus } from 'veza';

import { Config } from '../../configs/generalConfig';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config.js');

export default class IPCChildConnector {
    private child: ChildProcess;
    private client: Client;
    private readonly serverLabel: string;
    private _ping: number
    private task: string;

    public connected(): boolean {
        return this.client.servers.get(this.serverLabel).status === ClientSocketStatus.Connected;
    }

    public constructor(task: string) {
        this.task = task;
        this.client = new Client('MasterProcess');
        this.serverLabel = 'DownloadManager';
        this.connect();
    }

    private connect(): Promise<void> {
        return new Promise((res, rej): void => {
            let connected = false;
            // kill the process if its running
            if (this.child) this.child.kill();
            // close every connection
            if (this.client) this.client.servers.forEach((x): boolean => x.disconnect());
            this.child = fork(`${config.general.subTasks}/${this.task}.ts`);
            this.child.once('message', (e): void => {
                if (e.type !== 'READY_TO_CONNECT') return;
                this.client.connectTo(e.data);
                connected = true;
                res();
            });
            setTimeout((): void => {
                if (connected) return;
                rej(new Error('Connection timed out'));
            }, 20 * 1000);
        });
    }

    protected async send(data: any): Promise<any> {
        if (!this.connected) await this.connect();
        return this.client.sendTo(this.serverLabel, data);
    }

    public async ping(): Promise<number> {
        const timeStart = Date.now();
        await this.send({ type: 'PING' });
        this._ping = Date.now() - timeStart;
        return this._ping;
    }

    public kill(): void {
        if (this.client) this.client.servers.forEach((x): boolean => x.disconnect());
        if (this.child) this.child.kill();
    }
}