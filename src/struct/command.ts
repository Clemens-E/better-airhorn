import { BClient } from "./client";
import { Message, VoiceConnection, Permissions, PermissionString } from "discord.js";


export default abstract class Command {

    //* ~~~~~~~~~~~~ Miscellaneous ~~~~~~~~~~~~ //
    name: string;
    category: 'music' | 'misc' | 'owner';
    example: string;
    description: string;

    //* ~~~~~~~~~~~~~ Permissions ~~~~~~~~~~~~~ //
    userPermissions: PermissionString[];
    userChannelPermissions: PermissionString[];
    botPermissions: PermissionString[];
    botChannelPermissions: PermissionString[];

    //* ~~~~~~~~~~~~~ Requirements ~~~~~~~~~~~~ //
    voiceChannel: boolean;
    voteLock: boolean;

    abstract async exec(client: BClient, message: Message, args: string[], voice?: VoiceConnection): Promise<any>;
    constructor(client: BClient, infos: {
        name: string, category: 'music' | 'misc' | 'owner', example: string, description: string
        userPermissions: PermissionString[], userChannelPermissions: PermissionString[],
        botPermissions: PermissionString[], botChannelPermissions: PermissionString[]
        voiceChannel: boolean, voteLock: boolean
    }) {
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