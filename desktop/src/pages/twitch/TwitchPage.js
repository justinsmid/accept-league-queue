import React, {Component} from 'react';
import {getGlobal} from '../../util/util';
import TwitchBot from './TwitchBot';
import './TwitchPage.sass';
const electron = window.require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const ipcRenderer = electron.ipcRenderer;

const TWITCH_APP_CLIENT_ID = 'vgg3y1iox13ljlp25hogabv408qz0m';
const TWITCH_REDIRECT_URL = 'http://localhost:6969/twitch/oauth/redirect';
const TWITCH_RESPONSE_TYPE = 'code';
const TWITCH_OAUTH_SCOPE = 'channel:read:subscriptions';

let authWindow;

/**
 * TODO:
 * Handle access token expiring
 * Probably should have some more error checking in the access token stuff
 */
export default class TwitchPage extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            accessToken: null,
            twitchUserData: null,
            twitchBotConnected: false
        };

        this.twitchBot = new TwitchBot();

        this.startAuthentication = this.startAuthentication.bind(this);
        this.updateTwitchUserFromToken = this.updateTwitchUserFromToken.bind(this);
        this.disconnectTwitchBot = this.disconnectTwitchBot.bind(this);
        this.connectTwitchBot = this.connectTwitchBot.bind(this)
        this.unauthenticateTwitch = this.unauthenticateTwitch.bind(this);
    }

    componentDidMount() {
        const accessTokenStr = getGlobal('twitchAuthStorage').getItem('accessToken');
        if (accessTokenStr) {
            const accessToken = JSON.parse(accessTokenStr);

            this.updateTwitchUserFromToken(accessToken);

            this.setState({accessToken});
        }
    }

    updateTwitchUserFromToken(accessToken) {
        fetch(`https://api.twitch.tv/helix/users/`, {
            headers: {
                'Client-ID': TWITCH_APP_CLIENT_ID,
                'Authorization': `Bearer ${accessToken.access_token}`
            }
        })
            .then(res => res.json())
            .then(async res => {
                const twitchUserData = res.data[0];

                await this.disconnectTwitchBot();
                await this.connectTwitchBot(twitchUserData.display_name);

                this.setState({twitchUserData});
            });
    }

    startAuthentication() {
        authWindow = new BrowserWindow({
            title: 'Twitch oAuth',
            width: 800,
            height: 600,
            show: false
        });

        const url = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_APP_CLIENT_ID}&redirect_uri=${TWITCH_REDIRECT_URL}&response_type=${TWITCH_RESPONSE_TYPE}&scope=${TWITCH_OAUTH_SCOPE}`;

        authWindow.loadURL(url);
        authWindow.show();

        authWindow.on('closed', function () {
            authWindow = null;
        });

        ipcRenderer.on('gotTwitchAccessToken', (event, accessToken) => {
            authWindow.close();

            this.updateTwitchUserFromToken(accessToken);
        });
    }

    async disconnectTwitchBot() {
        this.twitchBot.disconnect();
        this.setState({twitchBotConnected: false});
    }

    connectTwitchBot(channelName) {
        channelName = channelName || this.state.twitchUserData.display_name;

        const result = this.twitchBot.connect(channelName).then(() => {
            this.setState({twitchBotConnected: true});
        });

        return result;
    }

    unauthenticateTwitch() {
        this.twitchBot.disconnect();
        this.setState({
            accessToken: null,
            twitchUserData: null
        });
        // TODO: Remove accessToken from cache
    }

    render() {
        const {twitchUserData, twitchBotConnected} = this.state;

        const twitchAuthenticated = !!twitchUserData;

        return (
            <div className="page">
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    {twitchAuthenticated ?
                        <div>
                            <p>Logged in as: {twitchUserData.display_name || ''}</p>
                            <div className="authenticated-actions">
                                {twitchBotConnected && <button onClick={this.disconnectTwitchBot}>Disconnect from chat</button>}
                                {!twitchBotConnected && <button onClick={() => this.connectTwitchBot()}>Connect to chat</button>}
                                <button onClick={this.unauthenticateTwitch}>Log out</button>
                            </div>
                        </div>
                        : <button onClick={this.startAuthentication}>Authenticate</button>
                    }
                </div>
            </div>
        );
    }
}