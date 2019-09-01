import { BClient } from '../models/Client';
import { logger } from '../classes/Logger';

module.exports = (client: BClient): void => {
    client.AudioStorage.fetchAll().then((r): void =>
        r.forEach((x): Promise<boolean> => client.AudioStorage.similarity.add(x.commandname))
    );
    logger.log(`ready as ${client.user.tag}`);
};