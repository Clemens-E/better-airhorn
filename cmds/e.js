/* eslint-disable no-unused-vars */
const fetch = require('node-fetch');
const child = require('child_process');
module.exports.run = async (client, message, args) => {
    if (message.author.id !== client.config.ownerid) return;
    const channel = message.channel;
    const guild = message.guild;
    try {
        const code = args.join(' ');
        let evaled = eval(code);
        evaled = await clean(client, evaled);
        if (evaled.length < 2000) {
            channel.send(evaled, {
                code: 'xl',
            });
        } else {
            fetch('https://txtupload.cf/api/upload', {
                    method: 'post',
                    body: evaled,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                })
                .then(res => res.json())
                .then(r => channel.send(`https://txtupload.cf/${r.hash}#${r.key}`));
        }
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${await clean(client, err)}\n\`\`\``);
    }
};
async function clean(client, text) {
    if (text && text.constructor.name == 'Promise') {
        text = await text;
    }
    if (typeof evaled !== 'string') {
        text = require('util').inspect(text, {
            depth: 2,
        });
    }

    text = text
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203))
        .replace(client.token, 'my token');

    return text;
}
exports.help = {
    name: 'eval',
    category: 'owner commands',
    example: 'e client.token',
    description: 'runs js code',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
};