const Discord = require('discord.js');
const fetch = require('node-fetch');
module.exports.run = async (client, message) => {
    const emojis = ['⏩', '⏪', '▶', '◀'];
    const cmds = [];
    client.commands.forEach(element => {
        cmds.push(element.help);
    });
    const comds = {
        0: cmds.filter(m => m.category === 'entertainment'),
        1: cmds.filter(m => m.category === 'others'),
        2: cmds.filter(m => m.category === 'owner commands'),
    };
    let topicPage = 0;
    let cmdPage = 0;
    let pastetxt = '';
    Object.keys(comds).map(k => {
        const r = comds[k];
        pastetxt += `\n\nCategory: ${r[Object.keys(r)[0]].category}\n`;
        r.map(d => pastetxt += `Name: ${d.name}\ndescription: ${d.description}\nexample: ${d.example}\n\n`);
    });
    let link = await fetch('https://txtupload.cf/api/upload', {
        method: 'post',
        body: pastetxt,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
    link = await link.json();
    const embed = new Discord.MessageEmbed()
        .setTitle('Help Text')
        .setDescription('React with ▶ to see the next command.\nReact with ⏩ to skip to the next category')
        .addField('All Commands', `[all commands in one list](https://txtupload.cf/${link.hash}#${link.key})\n[GitHub](https://github.com/Clemens-E/better-airhorn)\n[Support Server](https://discord.gg/FFeAfZ9)`)
        .setColor(client.config.cn);
    const msg = await message.channel.send(embed);
    setTimeout(() => {
        msg.edit(new Discord.MessageEmbed(msg.embeds[0])
            .setDescription(`Name: ${comds[topicPage][cmdPage].name}
        description: ${comds[topicPage][cmdPage].description}
        example: \`${comds[topicPage][cmdPage].example}\``).setTitle(`Category: ${comds[topicPage][cmdPage].category}`)
            .setFooter(`Command ${cmdPage + 1}/${comds[topicPage].length} | Category ${topicPage + 1}/${Object.keys(comds).length}`));
    }, 4000);
    const filter = (r, u) => u.id === message.author.id;
    const rcollector = msg.createReactionCollector(filter, {
        time: 300000,
    });
    await msg.react('◀');
    await msg.react('▶');
    await msg.react('⏪');
    await msg.react('⏩');
    rcollector.on('collect', async (r) => {
        r.users.remove(r.users.last()).catch((O_o) => O_o);
        if (!emojis.includes(r.emoji.name)) return;
        switch (r.emoji.name) {
            case '⏩':
                if (topicPage === Object.keys(comds).length - 1) return;
                topicPage++;
                cmdPage = 0;
                break;
            case '⏪':
                if (topicPage <= 0) return;
                topicPage--;
                cmdPage = 0;
                break;
            case '▶':
                if (cmdPage === comds[topicPage].length - 1) return;
                cmdPage++;
                break;
            case '◀':
                if (cmdPage <= 0) return;
                cmdPage--;
                break;
        }
        msg.edit(new Discord.MessageEmbed(msg.embeds[0])
            .setDescription(`Name: ${comds[topicPage][cmdPage].name}
description: ${comds[topicPage][cmdPage].description}
example: \`${comds[topicPage][cmdPage].example}\``).setTitle(`Category: ${comds[topicPage][cmdPage].category}`)
            .setFooter(`Command ${cmdPage + 1}/${comds[topicPage].length} | Category ${topicPage + 1}/${Object.keys(comds).length}`));
    });

};

exports.help = {
    name: 'help',
    category: 'others',
    example: 'help',
    description: 'shows the help dialog',
    userPermissions: [],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES', 'ADD_REACTIONS'],
};