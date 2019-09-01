import { PermissionString, VoiceConnection } from 'discord.js';

import { BClient } from './Client';
import { BMessage } from './Message';

export default abstract class Command {

    //* ~~~~~~~~~~~~ Miscellaneous ~~~~~~~~~~~~ //
    public name: string;
    public category: 'music' | 'misc' | 'owner';
    public example?: string;
    public description: string;

    //* ~~~~~~~~~~~~~ Permissions ~~~~~~~~~~~~~ //
    public userPermissions: PermissionString[];
    public userChannelPermissions: PermissionString[];
    public botPermissions: PermissionString[];
    public botChannelPermissions: PermissionString[];

    //* ~~~~~~~~~~~~~ Requirements ~~~~~~~~~~~~ //
    public voiceChannel: boolean;
    public voteLock: boolean;


    protected client: BClient;
    /**
     *Will be called whenever a command gets executed
     *
     * @abstract
     * @param {BClient} client
     * @param {BMessage} message
     * @param {string[]} args
     * @param {VoiceConnection} [voice]
     * @returns {Promise<any>}
     * @memberof Command
     */
    public abstract async exec(message: BMessage, args: string[], voice?: VoiceConnection): Promise<any>;

    /**
     *If voiceChannel is true, this will be checked, the command should override this and return a boolean,
     *wether he allows the connection, or not. For example, he could check if the requested Audio exists
     *! IT NEEDS TO NOTIFY THE AUTHOR, THE MESSAGE HANDLER WILL SILENTLY RETURN
     *
     * @param {BMessage} message
     * @returns {Promise<boolean>}
     * @memberof Command
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async allowVoice(message: BMessage, args: string[]): Promise<boolean> {
        return true;
    }

    public constructor(Client: BClient, infos: {
        name: string; category: 'music' | 'misc' | 'owner'; example?: string; description: string;
        userPermissions: PermissionString[]; userChannelPermissions: PermissionString[];
        botPermissions: PermissionString[]; botChannelPermissions: PermissionString[];
        voiceChannel: boolean; voteLock: boolean;
    }) {
        this.client = Client;
        this.name = infos.name;
        this.category = infos.category;
        this.example = infos.example;
        this.description = infos.description;

        this.userPermissions = infos.userPermissions;
        this.userChannelPermissions = infos.userChannelPermissions;
        this.botPermissions = infos.botPermissions;
        this.botChannelPermissions = infos.botChannelPermissions;
        this.voiceChannel = infos.voiceChannel;
        this.voteLock = infos.voteLock;
    }
}