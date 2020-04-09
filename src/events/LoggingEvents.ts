import { Event } from 'shori';
import { logger } from '../utils/Logger';


export class LoggingEvents {

    @Event('ready')
    public ready(): void {
        logger.info('client ready');
    }

    @Event('error')
    public error(error: any): void {
        logger.warn(error);
    }

    @Event('disconnect')
    public disconnect(_: any, id: number): void {
        logger.error(`shard ${id} disconnected`);
    }

}
