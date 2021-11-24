# Discord Bot
* [Instruction](#instruction)
* [Features](#features)


## Instruction
### Get the Discord Bot Info
1. Add the bot from [Discord development](https://discord.com/developers/), and get the discord clientId, PERMISSIONS_INTEGER, discord bot token.
2. Use `https://discordapp.com/oauth2/authorize?client_id=<Bot_Client_ID>&scope=bot&permissions=<PERMISSIONS_INTEGER>` to add bot to server.

---
### Start the local server
1. Add .env file on root folder, and write down your DISCORD_TOKEN in it. Ex. `DISCORD_TOKEN=YOUR_DISCORD_TOKEN`.
2. Run `npm install` install packages which project needs.
3. Start dev server: `npm run start:dev`. It can auto restart server after save file.

---
### Build on docker
1. Clone the project and set discord-bot/ to the root directory.
2. Run `docker build -t <Image-Name> .` to build the image with set name.
3. Edit docker-compose.yml image to name which you set, DISCORD_TOKEN to your discord token.
4. Run `docker-compose up -d` to run the container in the background. Your can start using your bot.

---
## Features
1. Luck
    * Check daily luck
    * Command: !luck, !運勢
2. Play Audio
    * Play youtube song
    * Command: !play, !pause, !skip, !stop, !volume
3. Reddit
    * Get the hot or top 5 articles
    * Command: !reddit, !reddit [args], !reddit top, !reddit hot, !reddit list
3. Easy build with docker

---
## Reference
* [Discord development](https://discord.com/developers/)
