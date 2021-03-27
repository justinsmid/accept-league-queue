import React, {Component, useState} from 'react';
import {getGlobal, jsonResponse, equalsIgnoreCase} from '../../util/util';
import TwitchBot from './TwitchBot';
import './TwitchPage.sass';
import {defaultCommands, RequiredRole, argumentFormatExplanation, stringifyCommands, parseStringifiedCommands} from './defaultCommands';
import {Checkbox, Icon, Dialog, Tooltip} from '@material-ui/core';
import ModalButton from '../../components/ModalButton';
const electron = window.require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const ipcRenderer = electron.ipcRenderer;

const TWITCH_APP_CLIENT_ID = 'vgg3y1iox13ljlp25hogabv408qz0m';
const TWITCH_APP_CLIENT_SECRET = 'apl0hcj3qpdb5bialb7hq3twhoruol'; // TODO: Hide this.
const TWITCH_REDIRECT_URL = 'http://localhost:6969/twitch/oauth/redirect';
const TWITCH_RESPONSE_TYPE = 'code';
const TWITCH_OAUTH_SCOPE = 'channel:read:subscriptions';

const DEFAULT_TRUSTED_USERS = [
    'darkpolearm123'
];

let authWindow;

export const fetchTwitchApi = (url, accessToken, options) => {
    accessToken = (accessToken || JSON.parse(getGlobal('twitchAuthStorage').getItem('accessToken')));

    return fetch(url, {
        ...options,
        headers: {
            'Client-ID': TWITCH_APP_CLIENT_ID,
            'Authorization': `Bearer ${accessToken.access_token}`
        }
    });
};

// TODO: Probably should have some more error checking in the access token stuff
export default class TwitchPage extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            accessToken: null,
            twitchUserData: null,
            twitchBotConnected: false,
            commands: {},
            trustedUsers: [],
            showAddCustomCommandModal: false,
            showAddTrustedUserModal: false
        };

        this.twitchBot = new TwitchBot();

        ipcRenderer.on('AUTO_UPDATER_EVENT', (event, x, y) => {
            console.log(`Received AUTO_UPDATER_EVENT`, event, x, y);
        });

        this.startAuthentication = this.startAuthentication.bind(this);
        this.updateTwitchUserFromToken = this.updateTwitchUserFromToken.bind(this);
        this.disconnectTwitchBot = this.disconnectTwitchBot.bind(this);
        this.connectTwitchBot = this.connectTwitchBot.bind(this)
        this.unauthenticateTwitch = this.unauthenticateTwitch.bind(this);
        this.updateAccessTokenCache = this.updateAccessTokenCache.bind(this);
        this.refreshAccessToken = this.refreshAccessToken.bind(this);
        this.updateCommand = this.updateCommand.bind(this);
        this.updateCommands = this.updateCommands.bind(this);
        this.removeTrustedUser = this.removeTrustedUser.bind(this);
        this.addTrustedUser = this.addTrustedUser.bind(this);
    }

    async componentDidMount() {
        const commandsStorage = getGlobal('commandsStorage');
        const trustedStorage = getGlobal('trustedStorage');

        const accessTokenStr = getGlobal('twitchAuthStorage').getItem('accessToken');
        if (accessTokenStr) {
            let accessToken = JSON.parse(accessTokenStr);
            // TODO: Handle token expiring after page load

            accessToken = await this.updateAccessTokenCache(accessToken);

            this.updateTwitchUserFromToken(accessToken);

            this.setState({accessToken});
        }

        let commands = parseStringifiedCommands(commandsStorage.getItem('commands'));
        if (!commands) {
            commandsStorage.setItem('commands', stringifyCommands(defaultCommands));
            commands = defaultCommands;
        }

        let trustedUsers = JSON.parse(trustedStorage.getItem('users'));
        if (!trustedUsers) {
            trustedStorage.setItem('users', JSON.stringify(DEFAULT_TRUSTED_USERS));
            trustedUsers = DEFAULT_TRUSTED_USERS;
        }

        this.setState({commands, trustedUsers});
    }

    componentDidUpdate(prevProps, prevState) {
        this.twitchBot.setPageRef(this);
    }

    updateCommand(command, newValue) {
        this.updateCommands({
            ...this.state.commands,
            [command]: newValue
        });
    }

    updateCommands(commands) {
        this.setState({commands}, () => {
            getGlobal('commandsStorage').setItem('commands', stringifyCommands(commands));
        });
    }

    updateTwitchUserFromToken(accessToken) {
        fetchTwitchApi(`https://api.twitch.tv/helix/users/`, accessToken)
            .then(jsonResponse)
            .then(async res => {
                const twitchUserData = res.data[0];

                // TODO: [later] Allow user to configure whether the bot auto-connects
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

        ipcRenderer.on('gotTwitchAccessToken', async (event, accessToken) => {
            authWindow.close();

            accessToken = await this.updateAccessTokenCache(accessToken);

            this.updateTwitchUserFromToken(accessToken);
        });
    }

    async updateAccessTokenCache(accessToken) {
        const storage = getGlobal('twitchAuthStorage');

        const expiresIn = Math.ceil((accessToken.expiresAt - Math.ceil(Date.now())) / 1000);
        if (expiresIn <= 60) {
            accessToken = await this.refreshAccessToken(accessToken);
            accessToken = {
                ...accessToken,
                expiresAt: Date.now() + (accessToken.expires_in * 1000)
            };
        }

        storage.setItem('accessToken', JSON.stringify(accessToken));
        return accessToken;
    }

    refreshAccessToken(accessToken) {
        const url = `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${accessToken.refresh_token}&client_id=${TWITCH_APP_CLIENT_ID}&client_secret=${TWITCH_APP_CLIENT_SECRET}`;
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(accessToken)
        })
            .then(jsonResponse);
    }

    async disconnectTwitchBot() {
        this.twitchBot.disconnect();
        this.setState({twitchBotConnected: false});
    }

    connectTwitchBot(channelName) {
        channelName = channelName || this.state.twitchUserData.display_name;

        return this.twitchBot.connect(channelName).then(() => {
            this.setState({twitchBotConnected: true});
        });
    }

    unauthenticateTwitch() {
        this.disconnectTwitchBot();
        getGlobal('twitchAuthStorage').removeItem('accessToken');
        this.setState({
            accessToken: null,
            twitchUserData: null
        });
    }

    removeTrustedUser(userToRemove) {
        const {trustedUsers} = this.state;

        const newTrustedUsers = trustedUsers.filter(user => !equalsIgnoreCase(userToRemove, user));

        this.setState({trustedUsers: newTrustedUsers}, () => {
            getGlobal('trustedStorage').setItem('users', JSON.stringify(newTrustedUsers));
        });
    }

    addTrustedUser(user) {
        const {trustedUsers} = this.state;

        const newTrustedUsers = [...trustedUsers, user];

        this.setState({trustedUsers: newTrustedUsers}, () => {
            getGlobal('trustedStorage').setItem('users', JSON.stringify(newTrustedUsers));
        });
    }

    render() {
        const {twitchUserData, twitchBotConnected, commands, trustedUsers, showAddCustomCommandModal, showAddTrustedUserModal} = this.state;

        const twitchAuthenticated = !!twitchUserData;

        // TODO: [later] allow creating custom commands
        const closeCustomCommandModal = () => this.setState({showAddCustomCommandModal: false});
        const openCustomCommandModal = () => this.setState({showAddCustomCommandModal: true});
        const AddCustomCommandModal = () => {
            return (
                <div className="modal">
                    <div className="header">Add custom command</div>
                    <div className="content">
                        <p>Adding custom commands is not implemented yet.</p>
                    </div>
                    <div className="footer">
                        <div className="actions">
                            <p onClick={closeCustomCommandModal}>Cancel</p>
                            {/* <p onClick={confirm}>Confirm</p> */}
                        </div>
                    </div>
                </div>
            );
        };

        const closeTrustedUserModal = () => this.setState({showAddTrustedUserModal: false});
        const openTrustedUserModal = () => this.setState({showAddTrustedUserModal: true});
        const AddTrustedUserModal = () => {
            const [name, setName] = useState('');

            const confirm = () => {
                if (!name) {
                    electron.remote.dialog.showErrorBox('Name cannot be empty', 'Please make sure you fill in a name');
                    return;
                }

                if (trustedUsers.some(trustedUser => equalsIgnoreCase(trustedUser, name))) {
                    electron.remote.dialog.showErrorBox('User already trusted', `The user '${name}' is already trusted.`);
                } else {
                    this.addTrustedUser(name);
                    closeTrustedUserModal();
                }
            };

            return (
                <div className="modal">
                    <h3 className="header">Add trusted user</h3>
                    <div className="content">
                        <label>
                            Name: <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.currentTarget.value)}
                                onKeyPress={e => e.key === 'Enter' && confirm()} />
                        </label>
                    </div>
                    <div className="footer">
                        <div className="actions">
                            <p onClick={closeTrustedUserModal}>Cancel</p>
                            <p onClick={confirm}>Confirm</p>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="page">
                <div className="page-content">
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
                    <div className="table">
                        <div className="header">
                            <h3>Commands</h3>
                            <div className="add" onClick={openCustomCommandModal}>
                                <p>Add new command</p>
                                <Icon>add_circle</Icon>
                            </div>
                            <Dialog open={showAddCustomCommandModal} onBackdropClick={closeCustomCommandModal}>
                                <AddCustomCommandModal />
                            </Dialog>
                        </div>
                        <div className="table-row bold">
                            <p>Enabled</p>
                            <p>Name</p>
                            <p>Command</p>
                            <abbr title='Command can only be used by people with this role'><p>Limited to</p></abbr>
                            <p>Description</p>
                            <p>Usage</p>
                        </div>
                        {Object.entries(commands).map(([twitchCommand, command]) => {
                            const toggleCommandEnabled = e => {
                                this.updateCommand(twitchCommand, {
                                    ...command,
                                    enabled: !command.enabled
                                });
                            };

                            const setRequiredRole = e => {
                                this.updateCommand(twitchCommand, {
                                    ...command,
                                    requiredRole: e.currentTarget.value
                                });
                            };

                            const ArgumentsSection = ({title, values}) => (
                                <div className="section">
                                    <p className="section-header">{title}</p>
                                    {values.map(({name, type, description}) => (
                                        <div key={name} className="section">
                                            <p className="section-header">{name}</p>
                                            <div className="flex">
                                                <p className="section-header">Type:</p>
                                                <p style={{marginLeft: '5px'}}>{type}</p>
                                            </div>
                                            <p>{description}</p>
                                        </div>
                                    ))}
                                </div>
                            );

                            return (
                                <div key={twitchCommand} className="table-row">
                                    <Checkbox checked={command.enabled} onChange={toggleCommandEnabled} size='small' />
                                    <div>{command.name}</div>
                                    <div>{'!' + twitchCommand}</div>
                                    <select className="role-selector" value={command.requiredRole} name="required-role" onChange={setRequiredRole}>
                                        {Object.values(RequiredRole).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <ModalButton buttonTitle='View'>
                                        <div className="modal">
                                            <h3 className="header">Description</h3>
                                            <p className="content">{command.description}</p>
                                        </div>
                                    </ModalButton>

                                    <ModalButton buttonTitle='View'>
                                        <div className="modal">
                                            <h3 className="header">Usage</h3>
                                            <div className="content">
                                                <div className="section">
                                                    <p className="section-header">Command format</p>
                                                    <p>{command.format}</p>
                                                </div>
                                                {command.argumentData ?
                                                    <div className="section">
                                                        <p className="section-header">Argument format</p>
                                                        <p>{argumentFormatExplanation(command.argumentData.format)}</p>
                                                    </div>
                                                    : <div className="section">
                                                        <p className="section-header">Arguments</p>
                                                        <p>No arguments</p>
                                                    </div>
                                                }
                                                {command.argumentData && command.argumentData.requiredArguments &&
                                                    <ArgumentsSection title='Required arguments' values={command.argumentData.requiredArguments} />}
                                                {command.argumentData && command.argumentData.optionalArguments &&
                                                    <ArgumentsSection title='Optional arguments' values={command.argumentData.optionalArguments} />}
                                            </div>
                                        </div>
                                    </ModalButton>
                                    {/* TODO: [later] Remove command */}
                                </div>
                            );
                        })}
                    </div>
                    <div className="table">
                        <div className="header">
                            <h3>Trusted users</h3>
                            <div className="add" onClick={openTrustedUserModal}>
                                <span>Add user</span>
                                <Icon>add_circle</Icon>
                            </div>
                            <Dialog open={showAddTrustedUserModal} onBackdropClick={closeTrustedUserModal}>
                                <AddTrustedUserModal />
                            </Dialog>
                        </div>
                        <div className="table-row bold">
                            <p>Name</p>
                            <p>Remove</p>
                        </div>
                        {trustedUsers.map(user => {
                            const canBeRemoved = !DEFAULT_TRUSTED_USERS.some(defaultTrustedUser => (
                                defaultTrustedUser === user.toLowerCase()
                            ));

                            return (
                                <div key={user} className="table-row">
                                    <p>{user}</p>
                                    <div className="flex center">
                                        <Tooltip title={canBeRemoved ? '' : 'Cannot remove this user'}>
                                            <Icon
                                                className={`button ${canBeRemoved ? 'enabled' : 'disabled'}`}
                                                color={canBeRemoved ? 'inherit' : 'disabled'}
                                                onClick={canBeRemoved ? () => this.removeTrustedUser(user) : null}>
                                                delete
                                        </Icon>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}