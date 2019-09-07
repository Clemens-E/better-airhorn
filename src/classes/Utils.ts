import { Channel, CollectorFilter, Message, TextChannel } from 'discord.js';

import { BMessage } from '../models/Message';

interface ConfirmationCallback {
    (m: Message, value: string): Promise<boolean>;
}

export default class Utils {
    static promptMessage(message: Message, channel: Channel, time: number, filter: CollectorFilter, cb: ConfirmationCallback): Promise<string> {
        let variable: string;
        return new Promise((res, rej): void => {
            const collector = (channel as TextChannel).createMessageCollector(filter, { time });
            collector
                .on('collect', async (m: BMessage) => {
                    if (m.content === '/cancel') return collector.stop();
                    variable = m.content;

                    if (!await cb(m, variable)) {
                        variable = undefined;
                        return;
                    }
                    if (variable) collector.stop();
                })
                .on('end', async () => {
                    if (!variable) {
                        rej(new Error('no variable in time provided or cancelled'));
                    }
                    res(variable);
                });
        });
    }
}