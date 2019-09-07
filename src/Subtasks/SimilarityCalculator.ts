import { Server, NodeMessage } from 'veza';
import Similar from 'string-similarity';
import { logger } from '../classes/Logger';

const srv = new Server('SimilarityCalculator');
let commands: string[] = [];

srv.on('connect', (client: any): void => logger.info(`${client.name} connected to ${srv.name}`));

srv.on('message', (m: NodeMessage): void => {
    if (m.data.type === 'ADD_NAME') {
        commands.push(m.data.data);
        logger.debug(`[IPC] added ${m.data.data} to list`);
        m.reply(true);
    } else if (m.data.type === 'REMOVE_NAME') {
        commands = commands.filter((x: string): boolean => x !== m.data.data);
        logger.debug(`[IPC] removed ${m.data.data} from list`);
        m.reply(true);
    } else if (m.data.type === 'CALCULATE_BEST_RESULT') {
        m.reply(Similar.findBestMatch(m.data.data, commands.length > 0 ? commands : ['']).bestMatch.target);
    } else if (m.data.type === 'PING') {
        m.reply('pong');
    }
});

setInterval((): void => {
    commands.sort((a, b): number => a.localeCompare(b));
}, 20 * 1000);

srv.listen()
    .then((p: Server): boolean => process.send({ type: 'READY_TO_CONNECT', data: p.server.address() }));