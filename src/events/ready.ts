import { BClient } from '../models/client';

module.exports = (client: BClient): void => {
    console.log(`ready as ${client.user.tag}`);
};