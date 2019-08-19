import fs from 'fs';
import mk from 'mkdirp';
import { promisify } from 'util';

export default class FileSystemUtils {

    public static async exists(path: string, stats = true): Promise<{ exists: boolean; birthtime?: number; directory?: boolean; size?: number }> {
        const o = {
            exists: (await fs.promises.access(path).catch((): boolean => false)) === undefined ? true : false,
        };
        if (!o.exists || stats) return o;
        const stat = await fs.promises.stat(path);
        return { ...o, ...{ directory: stat.isDirectory(), size: stat.size, birthtime: stat.birthtimeMs } };
    };


    public static delete(path: string, ignoreErrors = false): Promise<void> | void {
        if (ignoreErrors) return fs.unlink(path, (): void => null);
        return fs.promises.unlink(path);
    }

    public static ensureDir(path: string): Promise<any> {
        return promisify(mk)(path);
    }
}
