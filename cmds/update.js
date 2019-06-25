const {
    exec,
} = require('child_process');
module.exports.run = async (client, message) => {
    if (message.author.id !== client.config.ownerid) return;
    const msg = await message.channel.send(`${client.config.updating} executing pull command...`);
    exec('git pull origin master', async (err, stdout) => {
        if (err) throw err;
        if (stdout === 'Already up-to-date.\n') return msg.edit(stdout);
        await msg.edit(`${client.config.updating}\`\`\`fix\n${stdout}\`\`\`${client.config.loading}Now restarting`);
        client.settings.set('lastMessage', {
            msg: msg.id,
            channel: msg.channel.id,
            content: stdout,
        });
        console.log('updated code. restarting now');
        process.exit(0);
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