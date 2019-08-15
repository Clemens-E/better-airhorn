export default interface AudioCommand {
    commandname: string;
    filename: string;
    privacymode: 0 | 1 | 2 | 3;
    guild: string;
    user: string;
}