import { BClient } from '../models/client';

module.exports = (client: BClient): void => {
    client.AudioStorage.fetchAudios().then(r =>
        r.forEach(x => client.AudioStorage.similarity.add(x.commandname))
    );
    console.log(`ready as ${client.user.tag}`);
};