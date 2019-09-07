import { ChildProcess, fork } from 'child_process';
import { Client, ClientSocketStatus } from 'veza';

import { Config } from '../../configs/generalConfig';
import { logger } from './Logger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config');

export default class IPCChildConnector {
    private child: ChildProcess;
    private client: Client;
    private readonly serverLabel: string;
    private _ping: number
    private task: string;

    public get connected(): boolean {
        const server = this.client.servers.get(this.serverLabel);
        return !!server && server.status === ClientSocketStatus.Ready;
    }

    public constructor(task: string, serverLabel: any) {
        this.task = task;
        this.client = new Client('MasterProcess');
        this.serverLabel = serverLabel;
        this.connect();
    }

    private connect(): Promise<void> {
        return new Promise((res, rej): void => {
            if (this.connected) return res();
            let connected = false;
            // kill the process if its running
            if (this.child) this.child.kill();
            // close every connection
            if (this.client) this.client.servers.forEach((x): boolean => x.disconnect());
            this.child = fork(`${config.general.subTasks}/${this.task}`);
            logger.debug('[IPC]', `forking new ${this.task} child`);
            this.child.once('message', async (e): Promise<void> => {
                if (e.type !== 'READY_TO_CONNECT') return;
                await this.client.connectTo(e.data);
                this.client.on('connect', (): void => logger.debug('[IPC]', `connected to ${this.serverLabel}`));
                this.client.on('disconnect', (): void => logger.debug('[IPC]', `disconnected from ${this.serverLabel}`));
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
        logger.debug('[IPC]', `received ping: ${this._ping} ms`);
        return this._ping;
    }

    public kill(): void {
        logger.debug('[IPC]', 'disconnecting from every process and killing child');
        if (this.client) this.client.servers.forEach((x): boolean => x.disconnect());
        if (this.child) this.child.kill();
    }
}