const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec);
const timeout = promisify(setTimeout);

module.exports.run = async (client, message) => {
    if (message.author.id !== client.config.ownerid) return message.channel.send('Updating takes a lot of time, thats why this command is only for the Owner, sorry.');
    if (!client.config.prod) return message.channel.send('client is not running in production and will not update.');
    const msg = await message.channel.send(`${client.config.updating} looking for updates...`);

    exec('git pull origin master').then(async r => {
        const stdout = r.stdout;
        if (['Already up to date.\n', 'Already up-to-date.\n'].includes(stdout)) return msg.edit(stdout);
        await msg.edit('found updates, deploying them.');
        const pg = client.dtl.newProgress(['pulled updates', 'updated dependencies', `${client.AudioStorage.tasks.length + 1} Tasks finished`, 'closing database connection', 'process restarted'], msg);
        client.shuttingDown = true;
        await timeout(1000);
        await pg.next();
        if (stdout.includes('package')) {
            const worked = await exec('npm i').catch(console.error);
            if (!worked) return msg.edit('Updating dependencies failed, restart cancelled');
        }
        await pg.next();
        await client.AudioStorage.shutdown();
        await timeout(1000);
        await pg.next();
        client.settings.set('lastMessage', {
            msg: msg.id,
            channel: msg.channel.id,
            tasks: pg.tasks,
            index: pg.currentIndex,
        });
        await client.settings.close();
        await pg.next();
        await client.destroy();
        console.log('updated code. restarting now');
        process.exit(0);
    }).catch(err => {
        msg.edit('Something went wrong.');
        console.error(err);
    });
};

exports.help = {
    name: 'update',
    category: 'owner commands',
    example: 'update',
    description: 'pulls from origin. restart if changes where made.',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
};