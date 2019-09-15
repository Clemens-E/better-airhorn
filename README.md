# Better Airhorn
## Upload/Record own Audio Clips and create a Soundboard!

[![Discord Bots](https://discordbots.org/api/widget/status/503996428042108928.svg)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/servers/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/upvotes/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/lib/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)
[![Discord Bots](https://discordbots.org/api/widget/owner/503996428042108928.svg?noavatar=true)](https://discordbots.org/bot/503996428042108928)\
[![Known Vulnerabilities](https://snyk.io//test/github/Clemens-E/better-airhorn/badge.svg?targetFile=package.json)](https://snyk.io//test/github/Clemens-E/better-airhorn?targetFile=package.json)


## Host Information
![Average CPU Usage](https://dashboard.chilo.space/api/v1/badge.svg?chart=system.cpu&alarm=10min_cpu_usage&refresh=auto&label=Average%20CPU%20Usage)
![System Uptime](https://dashboard.chilo.space/api/v1/badge.svg?chart=system.uptime&label=System%20Uptime&refresh=10)\
![Free Memory](https://dashboard.chilo.space/api/v1/badge.svg?chart=mem.available&label=Free%20Memory&refresh=auto&values_color=gray:null|green%3C2000|orange%3C1000|red%3C500)
![Used Disk Space](https://dashboard.chilo.space/api/v1/badge.svg?chart=disk_space._&alarm=disk_space_usage&label=Used%20Disk%20Space&refresh=auto)

## What is this Bot about?
**Better-Airhorn is supposed to replace the old [Airhorn Solutions](https://airhorn.solutions/) Bot, and add additional features.
Those additional features are:**
- Upload audio files (mp3, wav, ogg, m4a)
-  Record yourself in a voice channel
- Use the earlier *recorded* or *uploaded* files like a soundboard
- Rate sounds, or get your sounds rated and make it into the top 10 list


## How to use

**Uploading Files**\
Upload any audio file (mp3, wav, ogg, m4a) to any channel which the bot a read/send messages, react and use external emojis.\
If everything went well, the bit will react with an “upload” emoji.\
You have 30 Seconds time to react, and as soon as you do, the bot starts downloading and converting your file.\
It will then prompt you to set a name, and privacy

**Recording Files**\
Use the `recordme \<time\>` command while being in a voice channel.\
The bot will join your channel, and record *only your* voice for `\<time\>` seconds.\
It will then prompt you to set a name, and privacy

**Play Sounds**\
You can now run `play \<time\>` to play your files (or any other public file)\
After it finished, you can upvote/downvote the file

**List Sounds**\
If you want to see a list of the most upvoted audios, you can do
`list ['guild' or 'mine']`\
doing only `list` will show the public ones


# RULES FOR UPLOADING
**You are <u>not</u> allowed to upload copyrighted content or any other media that interferes with the German Law.\
Critical content (copyrighted, law issues etc) will be removed on sight**


## How I save files

By using the *`$recordme` command* or *upload audio to the bot* you agree to store the audio file on my server, I can not guarantee that there will never be a security breach but I will do my best to prevent them.\
Just to make sure, do <u>never</u> record or upload private information.

**If you don't want the audio to be stored on my file system, use mode zero ('only send'). By choosing it, the bot will send you the file over direct messages, and then immediately delete it from his file system and the database.**

## Self Hosting

Self hosting is not supported, you can try, but I dont recommend you to do it.
## Dev Branch

The [Dev Branch](../../tree/dev) is only used to transfer code between machines. Under no circumstances you should run this code, it may be unstable, unfinished or even include known issues.
