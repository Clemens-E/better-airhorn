export class Config {
    colors: Colors;
    emojis: Emojis;
    audio: Audio;
    general: General;
}


//* ~~~~~~~~~~~~ Color Settings ~~~~~~~~~~~ //
interface Colors {
    error: string;
    warn: string;
    neutral: string;
    success: string;
}

//* ~~~~~~~~~~~~ Emoji Settings ~~~~~~~~~~~ //
interface Emojis {
    loading: string;
    updating: string;
    crashed: string;
    empty: string;
    done: string;
    offline: string;
    online: string;
    import: string;
}

//* ~~~~~~~~~~~~ Audio Settings ~~~~~~~~~~~ //
interface Audio {
    bitrate: 192 | 224 | 256 | 320;
    storage: string;
    musicFolder: string;
    maxRecordTime: number;
    maxFileSize: number;
    maxFolderSize: number;
}

//* ~~~~~~~~~~~ General Settings ~~~~~~~~~~ //
interface General {
    ownerID: string;
    prefix: string;
    voteURL: string;
    subTasks: string;
    supportServer: string;
}