/* eslint-disable no-unused-vars */
const fetch = require('node-fetch');
const child = require('child_process');
module.exports.run = async (client, message, args) => {
    const channel = message.channel;
    const guild = message.guild;
    let evaled;
    let evaledByApi = false;
    try {
        const code = args.join(' ');
        if (message.author.id === client.config.ownerid && message.flags[0] !== 'b') {
            evaled = eval(code);

        } else {
            evaledByApi = true;
            const r = await (await fetch('https://run.glot.io/languages/javascript/latest', {
                method: 'POST',
                headers: {
                    Authorization: 'Token ' + client.config.glottoken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'files': [{
                        'name': 'index.js',
                        'content': code,
                    }],
                }),
            })).json();
            if (r.message) throw new Error(r.message);
            if (!!r.stderr && r.stderr.length > 0) throw new Error(r.stderr);
            evaled = r.stdout;
        }
        if (!evaledByApi) evaled = await clean(client, evaled);
        if (evaled.length < 2000) {
            if (evaled.length === 0) return channel.send('No Output. Use `console.log` to generate outout.');
            channel.send(`\`\`\`xl\n${evaled}\`\`\``);
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
        evaled = err.message;
        message.channel.send(`\`ERROR\` \`\`\`xl\n${ evaled.replace(client.token, 'no, fuck you')}\`\`\``);
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
        .replace(client.token, 'no, fuck you');

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