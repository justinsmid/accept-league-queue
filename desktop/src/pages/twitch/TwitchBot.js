import tmi from 'tmi.js';
import {commands} from './commands';

const BOT_USERNAME = 'LCU_bot';
const OAUTH_TOKEN = 'oauth:jz3i5tbf9pdbp93pe39uals7qg4si5';

// Define configuration options
const opts = {
    identity: {
        username: BOT_USERNAME,
        password: OAUTH_TOKEN
    }
};

export default class TwitchBot {
    constructor() {
        this.client = null;
    }

    connect(channelName) {
        console.log(`[Twitch bot]: Connecting to channel '${channelName}'...`);
        const client = new tmi.client({...opts, channels: [channelName]});

        client.on('message', this.onMessageHandler);
        client.on('connected', this.onConnectedHandler);

        this.client = client;

        return client.connect();
    }

    disconnect() {
        console.log('[Twitch bot]: Disconnecting...');
        return this.client && this.client.disconnect().catch(err => {});
    }

    onMessageHandler(target, context, msg, self) {
        if (self) return; // Ignore messages from the bot

        let msgSegments = msg.split(' ');

        if (msgSegments[0] !== '!lcu') return; // Ignore messages that don't start with !lcu

        msgSegments = msgSegments.splice(1); // Remove !lcu from message

        const command = msgSegments[0];

        msgSegments = msgSegments.splice(1); // Remove command from message

        if (!(command in commands)) {
            console.log(`[Twitch bot]: Command '${command}' unknown.`);
            return;
        }

        commands[command](msgSegments);
    }

    onConnectedHandler(addr, port) {
        console.log(`[Twitch bot]: Connected to ${addr}:${port}`);
    }
}