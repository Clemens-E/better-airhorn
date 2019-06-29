# Better Airhorn
## Record own Audio Clips and create a Soundboard!

[![Discord Bots](https://discordbots.org/api/widget/status/503996428042108928.svg)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/servers/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/upvotes/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/lib/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/owner/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/020d47a704a046b2b5c6d7fe7618fae6)](https://www.codacy.com/app/Clemens-E/better-airhorn?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Clemens-E/better-airhorn&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io//test/github/Clemens-E/better-airhorn/badge.svg?targetFile=package.json)](https://snyk.io//test/github/Clemens-E/better-airhorn?targetFile=package.json)

## Recording Usage
[] = Optional\
<> = needed\
\
`$recordme [time]` | The bot will join your voice channel and will record you for [time] seconds, if not provided, he will record you for 5 seconds (maximum). For information about Storage see [this Point](#Recorded-Audio).\
`$deleteaudio <name>` | Will delete a audio clip you own by its name.\
`$play <file>` | The bot will join your voice channel and play a earlier recorded audio clip.\
`$listaudios <mine | guild | all>` | Sends a message listing every accessible audio clip filtered by the parameter.

There are some more commands, see them with `$help` and go trough them.

## Recorded Audio

By using the `$recordme` command you agree to store the audio file on my server, I can not guarantee that there will never be a security breach but I will do my best to prevent them.
Just to make sure, do never record private information.

**If you don't want the audio to be stored on my file system, use mode zero ('only send'). By choosing it, the bot will send you the file, and then immediately delete it from his file system and the database.**

## Self Hosting

While self hosting is not supported you can clone and run it yourself if you really want.\
Requirements:
- Lame
- FFmpeg
- Git
- Node

Clone this repository and copy the text in [config.json.example](config.json.example) into a file named `config.json`

## Dev Branch

The [Dev Branch](/Clemens-E/better-airhorn/tree/dev) is only used to transfer code between machines. Under no circumstances you should run this code, it may be unstable, unfinished or even include known issues.


