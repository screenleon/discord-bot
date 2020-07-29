import { Message, Guild } from 'discord.js';
import { createThis } from 'typescript';
import ytdl from 'ytdl-core';
import { MusicContract, SongInfo } from '../Interface';

export default class {
    private name = 'Play Audio';
    private command = ['!play', '!skip', '!pause', '!stop'];
    private ytRegexp = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\/?\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/g;
    private message: Message;
    private musicQueue!: MusicContract;
    private queue: Map<string, MusicContract>;
    private guild!: Guild;

    constructor(_message: Message, _queue: Map<string, any>) {
        this.message = _message;
        this.queue = _queue;
        if (!this.message.guild) return;
        this.guild = this.message.guild;
        if (!this.queue.has(this.guild.id))
            this.musicQueue = { textChannel: this.message.channel, songs: [], volume: 5, playing: false };
        else
            this.musicQueue = this.queue.get(this.guild.id) as MusicContract;
    }

    public getName = () => {
        return this.name;
    }

    public getCommand = () => {
        return this.command;
    }

    public execute = (command: string) => {
        const voiceChannel = this.message.member?.voice.channel;
        if (!voiceChannel) {
            this.message.reply('Please be in a voice channel first!');
            return;
        }
        if (!this.message.client.user) return;
        const permissions = voiceChannel.permissionsFor(this.message.client.user);
        if (!permissions?.has("CONNECT") || !permissions?.has("SPEAK")) {
            this.message.channel.send(
                "I need the permissions to join and speak in your voice channel!"
            );
            return;
        }

        const matchYT = this.ytRegexp.exec(command);
        if (command === this.command[0] && this.musicQueue.songs.length !== 0) {
            this.play();
            return;
        }
        if (!matchYT) {
            this.message.channel.send('Please type Youtube website!');
            return;
        };
        ytdl.getInfo(matchYT[0])
            .then(songInfo => {
                const song: SongInfo = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };
                if (this.musicQueue.songs.length === 0) {
                    if (this.musicQueue.hasOwnProperty('voiceChannel')) this.musicQueue.voiceChannel = voiceChannel;
                    this.musicQueue.songs.push(song);
                    return voiceChannel.join();
                }
                this.musicQueue.songs.push(song);
                this.queue.set(this.guild.id, this.musicQueue);
                this.message.channel.send(`${song.title} has been added to the queue`);
                return;
            }).then(voiceConnection => {
                if (!voiceConnection) return;
                if (!this.musicQueue.connection) this.musicQueue.connection = voiceConnection;
                this.play();
            }).catch(e => {
                console.error(e);
                this.queue.delete(this.guild.id);
                this.message.channel.send(e);
                return;
            })
    }

    private play = () => {
        const song = this.musicQueue.songs[0];
        if (!song) {
            this.musicQueue.voiceChannel?.leave();
            this.queue.delete(this.guild.id);
            return;
        } else if (!!this.musicQueue.songDispatcher) {
            if (this.musicQueue.playing === false) {
                this.musicQueue.songDispatcher?.resume();
                this.musicQueue.playing = true;
                this.queue.set(this.guild.id, this.musicQueue);
                this.musicQueue.textChannel.send(`Resume playing: **${this.musicQueue.songs[0].title}**`);
                return;
            } else {
                this.musicQueue.textChannel.send(`Already playing`);
                return;
            }
        }

        const dispatcher = this.musicQueue.connection?.play(ytdl(song.url))
            .on('start', () => {
                this.musicQueue.playing = true;
                this.queue.set(this.guild.id, this.musicQueue);
            })
            .on('finish', () => {
                this.musicQueue.songs.shift();
                this.queue.set(this.guild.id, this.musicQueue);
                this.play();
            })
            .on('stop', () => {
                this.musicQueue.songDispatcher?.end();
                this.musicQueue.textChannel.send('Stop playing');
                this.resetMusicQueie();
            })
            .on('error', e => {
                console.error(e);
            })

        dispatcher?.setVolumeLogarithmic(this.musicQueue.volume / 5);
        this.musicQueue.songDispatcher = dispatcher;
        this.queue.set(this.guild.id, this.musicQueue);
        this.musicQueue.textChannel.send(`Start playing: **${song.title}**`);
        return;
    }

    public pause = () => {
        const textChannel = this.musicQueue.textChannel;
        if (this.musicQueue.songs.length === 0) {
            textChannel.send(`There is no songs in queue!`);
            return;
        }

        if (!this.musicQueue.playing) {
            textChannel.send(`Already pause the song!`);
            return;
        }

        this.musicQueue.songDispatcher?.pause();
        this.musicQueue.playing = false;
        textChannel.send(`Pause playing: **${this.musicQueue.songs[0].title}**`);
        this.queue.set(this.guild.id, this.musicQueue);
        return;
    }

    public skip = () => {
        switch (this.musicQueue.songs.length) {
            case 0:
                this.message.channel.send('Music Queue is empty!')
                break;
            case 1:
                this.message.channel.send('The song is the last one!');
                break;
            default:
                this.musicQueue.songDispatcher?.emit('finish');
                break;
        }
    };

    public stop = () => {
        this.musicQueue.songDispatcher?.emit('stop');
        return;
    }

    private resetMusicQueie = () => {
        this.musicQueue.songs = [];
        this.musicQueue.playing = false;
        delete this.musicQueue.songDispatcher;
        delete this.musicQueue.connection;
        delete this.musicQueue.voiceChannel;
        this.queue.delete(this.guild.id);
        return;
    }
}