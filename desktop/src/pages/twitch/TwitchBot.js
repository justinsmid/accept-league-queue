import tmi from 'tmi.js';
import {RequiredRole} from './defaultCommands';
import {fetchTwitchApi} from './TwitchPage';
import {jsonResponse, equalsIgnoreCase} from '../../util/util';

const BOT_USERNAME = 'LCU_bot';
const OAUTH_TOKEN = 'oauth:jz3i5tbf9pdbp93pe39uals7qg4si5';

const opts = {
    identity: {
        username: BOT_USERNAME,
        password: OAUTH_TOKEN
    }
};

export default class TwitchBot {
    constructor() {
        this.client = null;
        this.pageRef = {};
    }

    setPageRef(ref) {
        this.pageRef = ref;
    }

    connect(channelName) {
        console.log(`[Twitch bot]: Connecting to channel '${channelName}'...`);
        const client = new tmi.client({...opts, channels: [channelName]});

        client.on('message', this.onMessageHandler.bind(this));
        client.on('connected', this.onConnectedHandler.bind(this));

        this.client = client;

        return client.connect();
    }

    disconnect() {
        console.log('[Twitch bot]: Disconnecting...');
        return this.client && this.client.disconnect().catch(err => {});
    }

    // TODO: More extensive testing
    async checkCommandPermissions(command, senderData) {
        const isBroadcaster = senderData['user-id'] === this.pageRef.state.twitchUserData.id;

        const checkIfIsFollower = () => fetchTwitchApi(`https://api.twitch.tv/helix/users/follows?from_id=${senderData['user-id']}&to_id=${this.pageRef.state.twitchUserData.id}&first=100`,)
            .then(jsonResponse)
            .then(res => res.total > 0);

        const checkIfIsTrusted = () => this.pageRef.state.trustedUsers.some(trustedUser => equalsIgnoreCase(trustedUser, senderData['display-name']));

        const isMod = senderData.mod === true;
        const isSub = senderData.sub === true;

        switch (command.requiredRole) {
            case RequiredRole.ANYONE:
                return true;
            case RequiredRole.FOLLOWERS:
                return await checkIfIsFollower();
            case RequiredRole.SUBSCRIBERS:
                return senderData.subscriber;
            case RequiredRole.MODS:
                return senderData.mod;
            case RequiredRole.TRUSTED:
                return checkIfIsTrusted();
            case RequiredRole.BROADCASTER:
                return isBroadcaster;
            case RequiredRole.FOLLOWERS_PLUS:
                return (isSub || isMod || isBroadcaster || checkIfIsTrusted() || await checkIfIsFollower());
            case RequiredRole.SUBSCRIBERS_PLUS:
                return (isSub || isMod || checkIfIsTrusted() || isBroadcaster);
            case RequiredRole.MODS_PLUS:
                return (isMod || checkIfIsTrusted() || isBroadcaster);
            case RequiredRole.TRUSTED_PLUS:
                return (checkIfIsTrusted() || isBroadcaster);
            default: throw new Error(`Checking command permissions for RequiredRole::${command.requiredRole} not implemented.`);
        }
    }

    async attemptToExecuteCommand(commandName, msgSenderData, args, ircChannel) {
        const {commands} = this.pageRef.state;

        if (!(commandName in commands)) {
            console.error(`[Twitch bot]: Command '${commandName}' unknown.`);
            return false;
        }

        const command = commands[commandName];

        if (command.enabled === false) {
            this.client.say(ircChannel, `@${msgSenderData['display-name']}, the command '${commandName}' is disabled.`);
            console.log(`[Twitch bot]: Command '${commandName}' was called, but this command is disabled. Command not executed.`);
            return false;
        }

        const userCanExecuteCommand = await this.checkCommandPermissions(command, msgSenderData);

        if (userCanExecuteCommand) {
            console.log(`[Twitch bot]: Executing command '${commandName}'`, command);

            return command.execute(args, this, msgSenderData, ircChannel);
        } else {
            this.client.say(ircChannel, `@${msgSenderData['display-name']}, the command '${commandName}' is only usable by ${command.requiredRole}.`);
            console.log(`[Twitch bot]: user '${msgSenderData['display-name']}' sent command '${commandName}' but does not have sufficient permissions. Command not executed.`);
            return false;
        }
    }

    onMessageHandler(target, msgSenderData, msg, self) {
        console.log(msgSenderData);
        console.log(this.pageRef);
        if (self) return; // Ignore messages from the bot

        let msgSegments = msg.split(' ');

        if (msgSegments[0] !== '!lcu') return; // Ignore messages that don't start with !lcu

        msgSegments = msgSegments.splice(1); // Remove !lcu from message

        const command = msgSegments[0];

        msgSegments = msgSegments.splice(1); // Remove command from message

        this.attemptToExecuteCommand(command, msgSenderData, msgSegments, target);
    }

    onConnectedHandler(addr, port) {
        console.log(`[Twitch bot]: Connected to ${addr}: ${port} `);
    }
}