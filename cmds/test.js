const fs = require('fs');
const Lame = require('node-lame').Lame;
const Discord = require('discord.js');
module.exports.run = async (client, message) => {
    message.member.voice.channel.join().then(async (conn) => {
        const dispatcher = conn.play('./audio/test.wav');
        dispatcher.on('end', () => {
            const stream = conn.receiver.createStream(message.author, {
                end: 'manual',
                mode: 'pcm',
            });
            const writeStream = fs.createWriteStream('./audio/lol.raw');
            stream.pipe(writeStream);

            stream.on('data', console.log);
            setTimeout(() => stream.destroy(), 5000);
            writeStream.on('close', () => {
                const encoder = new Lame({
                    output: './audio/demo.mp3',
                    bitrate: 192,
                    raw: true,
                }).setFile('./audio/lol.raw');
                encoder.encode().then(() => {
                    console.log('finished');
                    message.channel.send(message.author, new Discord.MessageAttachment('./audio/demo.mp3'));
                });
                conn.disconnect();
            });
            stream.on('close', () => {
                writeStream.end();
            });
        });

    });
};

exports.help = {
    name: 'test',
    category: 'settings',
    example: 'maxbuffer 8',
    description: 'sets the maximal messages in the interval for antispam until mute/kick',
    userPermissions: ['MANAGE_GUILD'],
    userChannelPermissions: [],
    myPermissions: [],
    myChannelPermissions: ['SEND_MESSAGES'],
    needsStorage: true,
};