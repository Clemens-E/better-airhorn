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
        client.shuttingDown = true;
        await timeout(1000);
        const raw = `\`\`\`fix\n${stdout}\`\`\``;
        if (stdout.includes('package')) {
            await msg.edit(`${raw}Updating dependencies ${client.config.loading}`);
            const worked = await exec('npm i').catch(console.error);
            if (!worked) return msg.edit(`${raw}Updating dependencies failed, restart cancelled`);
            await msg.edit(`${raw}Dependencies updated.`);
        }

        client.settings.set('lastMessage', {
            msg: msg.id,
            channel: msg.channel.id,
            content: stdout,
        });
        await msg.edit(`${raw}Waiting for ${client.AudioStorage.tasks.length + 1} to finish ${client.config.loading}`);
        await client.AudioStorage.shutdown();
        await timeout(1000);
        await msg.edit(`${raw}Restarting Process, this might take a while ${client.config.loading}`);
        await client.settings.close();
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