const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec);
module.exports.run = async (client, message) => {
    const msg = await message.channel.send(`${client.config.updating} executing pull command...`);
    exec('git pull origin master').then(async r => {
        const stdout = r.stdout;
        if (stdout === 'Already up to date.\n') return msg.edit(stdout);
        if (message.author.id !== client.config.ownerid) return msg.edit('Updates available, but you don\'t have enough permissions.');
        const raw = `\`\`\`fix\n${stdout}\`\`\``;
        await msg.edit(`${raw}Updating dependencies ${client.config.loading}`);
        const worked = await exec('npm i').catch(console.log);
        if (!worked) return msg.edit(`${raw}Updating dependencies failed, restart cancelled`);
        await msg.edit(`${raw}Dependencies updated.`);
        client.settings.set('lastMessage', {
            msg: msg.id,
            channel: msg.channel.id,
            content: stdout,
        });
        await client.destroy();
        console.log('updated code. restarting now');
        process.exit(0);
    }).catch(err => {
        msg.edit('Something went wrong.');
        console.log(err);
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