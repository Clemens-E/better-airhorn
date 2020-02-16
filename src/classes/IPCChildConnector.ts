import { ChildProcess, fork } from 'child_process';
import EventEmitter from 'events';
import { Client, ClientSocketStatus } from 'veza';
import { Config } from '../../configs/config';
import { logger } from '../structures/utils/Logger';


export default class IPCChildConnector extends EventEmitter {
    private child: ChildProcess;
    private client: Client;
    private readonly serverLabel: string;
    private _ping: number
    private task: string;
    private connecting: boolean;

    public get connected(): boolean {
        const server = this.client.servers.get(this.serverLabel);
        return !!server && server.status === ClientSocketStatus.Ready;
    }

    public constructor(task: string, serverLabel: string) {
        super();
        this.task = task;
        this.client = new Client('MasterProcess', { maximumRetries: 2 });
        this.serverLabel = serverLabel;
        this.connecting = false;
        this.connect();
    }

    private connect(): Promise<void> {
        return new Promise((res, rej): void => {
            if (this.connected) {
                this.client.on('raw', () => res());
                return;
            }
            if (this.connecting) {
                this.once('connect', () => res());
                return;
            }

            this.connecting = true;
            let connected = false;
            // kill the process if its running
            if (this.child && this.child.connected) this.child.kill();

            this.child = fork(`${Config.general.subTasks}/${this.task}`);
            logger.debug('[IPC]', `forking new ${this.task} child`);

            this.child.once('message', async (e): Promise<void> => {
                if (e.type !== 'READY_TO_CONNECT') return;
                this.client.once('ready', (): void => {
                    logger.debug('[IPC]', `connected to ${this.serverLabel}`);
                    this.emit('connect');
                    this.connecting = false;
                    connected = true;
                    res();
                });
                this.client.once('disconnect', (): void => {
                    logger.debug('[IPC]', `disconnected from ${this.serverLabel}`);
                    this.emit('disconnect');
                    if (!this.connecting) this.connect();
                });
                this.child.on('exit', () => this.emit('exit'));
                await this.client.connectTo(e.data);
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
