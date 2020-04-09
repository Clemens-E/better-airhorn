import { BaseGuard, Message } from 'shori';

export class ArgsGuard extends BaseGuard {
    protected argsCount = 1;

    constructor(minimumArgsCount: number) {
        super();
        this.argsCount = minimumArgsCount;
    }

    public async canActivate(message: Message, args: string[]): Promise<boolean> {
        if (args.length < this.argsCount) {
            await message.warn(`This command requires at least ${this.argsCount} arguments, you provided only ${args.length}`);
            return false;
        }
        return true;
    }
}
