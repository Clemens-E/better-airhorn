export default interface AudioCommand {
    commandName: string;
    fileName: string;
    privacyMode: 0 | 1 | 2 | 3;
    guild: string;
}