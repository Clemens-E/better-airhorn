import { Service } from 'shori';
import fetch from 'node-fetch';

@Service()
export class TextUploadService {
    public readonly base = 'https://hastebin.com';

    public async upload(text: string): Promise<string | null> {
        const res = await fetch(`${this.base}/documents`, {
            method: 'POST',
            body: text,
        }).then(r => r.json()).catch(Promise.reject);
        return res.key ?? null;
    }
}