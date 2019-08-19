import { TextChannel, VoiceConnection } from 'discord.js';
import lagThingy from 'event-loop-lag';
import fetch from 'node-fetch';

import { Config } from '../../configs/generalConfig';
import { BClient, BMessage } from '../models/client';

let messages = 0;
let messagesPerSecond = 0;
setTimeout((): void => {
    messagesPerSecond = messages / 10;
    messages = 0;
}, 10 * 1000);
const lag = lagThingy(1000);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require('../../configs/config.js');

/**
 *Checks if a user voted on discordbots.com
 *
 * @param {string} userID
 * @returns {Promise<boolean>} if the user voted or not
 */
async function hasVoted(userID: string): Promise<boolean> {
    const res = await fetch(`${config.general.voteURL}/hasVoted`, {
        headers: { authorization: process.env.DBLSECRET, 'userid': userID },
    });
    return await res.json();
}
module.exports = async (client: BClient, message: BMessage): Promise<any> => {
    messages++;
    if (message.author.bot || message.channel.type === 'dm') return;
    client.settings.ensure(message.guild.id, { prefix: client.config.general.prefix });

    const prefix = client.settings.get(message.guild.id, 'prefix') || client.config.general.prefix;

    // this will show the current prefix if the bot gets mentioned in the beginning of the message.
    if (new RegExp(`^(<@!?${client.user.id}>)`).test(message.content)) { message.neutral(`Prefix on this Guild: \`${prefix}\``); }

    if (message.content.indexOf(prefix) !== 0) return;

    const { author, member, guild } = message;
    const channel = message.channel as TextChannel;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const cmd = client.commands.get(command);
    let voiceConnection: VoiceConnection;

    if (!cmd) return;
    if (lag() > 20) {
        return message.error('the client is currently not able to process your request. please try again later',
            `process overloaded, ${lag().toFixed(2)}ms lag.`);
    };

    while (args[0] && args[0][0] === '-') {
        message.flags.push(args.shift().slice(1));
    }


    //  check for needed permissions  //
    const uMissingPerms = member.permissions.missing(cmd.userPermissions);
    const uChannelMissingPerms = channel.permissionsFor(message.member).missing(cmd.userChannelPermissions);
    const myMissingPerms = guild.me.permissions.missing(cmd.botPermissions);
    const myChannelMissingPerms = channel.permissionsFor(message.guild.me).missing(cmd.botChannelPermissions);
    if (myMissingPerms.length > 0) return message.warn(`I'm missing the following permissions:\`\`\`${myMissingPerms.join('\n')}\`\`\``);
    if (myChannelMissingPerms.length > 0) return message.warn(`I'm missing the following permissions:\`\`\`${myChannelMissingPerms.join('\n')}\`\`\``);
    if (uMissingPerms.length > 0) return message.warn(`You are missing the following permissions:\`\`\`${uMissingPerms.join('\n')}\`\`\``);
    if (uChannelMissingPerms.length > 0) return message.warn(`You are missing the following permissions:\`\`\`${uChannelMissingPerms.join('\n')}\`\`\``);

    //  connect to VoiceChannel, if required by the command  //
    if (cmd.voiceChannel) {
        if (!member.voice.channel) return message.warn('You need to be in a Voice Channel to run this command.');
        if (!member.voice.channel.joinable) return message.error('I\'m not able to join your Voice Channel. Is it full? Do I have permissions?');
        voiceConnection = await member.voice.channel.join().catch((): any => null);

        if (!voiceConnection) return message.error('There appeared an error while connecting to your Voice Channel');
    }

    //  check if the user voted, if required by the command  //
    if (cmd.voteLock) {
        const voted = await hasVoted(author.id).catch((): void => null);
        if (voted === null) {
            if (process.env.NODE_ENV === 'production') client.sentry.captureException(new Error('failed to fetch votes'));
            return message.error('Something went wrong while fetching votes.', 'Try again later');
        }

        if (!voted) {
            return message.warn(`This is a Beta Feature and requires a lot of Performance and Storage.
            You did not vote in the last 24 Hours. [Click me to Vote](https://discordbots.org/bot/503996428042108928/vote 'Vote for me!')
            If you already voted, but this doesn't work, wait up to 5 Minutes.`, 'Thank you for supporting this Bot!');
        }
    }

    client.messagesPerSecond = messagesPerSecond;

    // Hah, rejections? Thats what I get!
    const rejection = cmd.exec(client, message, args, voiceConnection);
    if (rejection) {
        rejection.catch((e: Error): void => {
            if (process.env.NODE_ENV === 'production') client.sentry.captureException(e);
            console.error(e);
            message.error(`${client.config.emojis.crashed} ${cmd.name} crashed.\nIf the problem consists please report it [here](https://discordapp.com/invite/5m7Xss3 \'Support Server\')`,
                e.message);
        });
    }
};
