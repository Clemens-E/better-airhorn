import IPCChildConnector from './IPCChildConnector';

export default class DownloadHandler extends IPCChildConnector {

    public constructor() {
        super('DownloadManager', 'DownloadManager');
    }


    public download(url: string, path: string): Promise<void> {
        return this.send({ type: 'DOWNLOAD', data: { url, path } });
    }

    public scan(path: string): Promise<boolean> {
        return this.send({ type: 'SCAN', data: { path } });
    }

    public duration(path: string): Promise<number> {
        return this.send({ type: 'DURATION', data: { path } });
    }
}