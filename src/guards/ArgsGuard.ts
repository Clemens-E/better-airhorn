import { BaseGuard, Message } from 'shori';

export class ArgsGuard extends BaseGuard {
    protected argsCount = 1;

    constructor(minimumArgsCount: number) {
        super();
        this.argsCount = minimumArgsCount;
    }

    public async canActivate(message: Message, args: string[]): Promise<boolean> {
        if (args.length < this.argsCount) {
            await message.error(`This command requires at least ${this.argsCount} arguments, you only provided ${args.length}`);
            return false;
        }
        return true;
    }
}
