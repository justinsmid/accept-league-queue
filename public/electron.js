const electron = require('electron');
const {app} = electron;
const {autoUpdater} = require("electron-updater");
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const express = require('express');
const fetch = require('node-fetch');
const LCUConnector = require('lcu-connector');
const cors = require('cors');

Buffer = Buffer || require('buffer').Buffer;

const path = require('path');
const url = require('url');
const {LocalStorage} = require('node-localstorage');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const EXPRESS_PORT = 6969;

const TWITCH_APP_CLIENT_ID = 'vgg3y1iox13ljlp25hogabv408qz0m';
const TWITCH_APP_CLIENT_SECRET = 'apl0hcj3qpdb5bialb7hq3twhoruol';
const TWITCH_REDIRECT_URL = `http://localhost:${EXPRESS_PORT}/twitch/oauth/redirect`;

const btoa = string => Buffer.from(string).toString('base64');

const jsonResponse = res => res.json();

const LOCAL_STORAGE_PREFIX = './localStorage/';

function onAppReady() {
    console.log('App ready!')
    // Check for app updates
    autoUpdater.checkForUpdates();

    // Set up localstorage
    const twitchAuthStorage = new LocalStorage(LOCAL_STORAGE_PREFIX + 'twitch-auth');
    const commandsStorage = new LocalStorage(LOCAL_STORAGE_PREFIX + 'commands');
    const trustedStorage = new LocalStorage(LOCAL_STORAGE_PREFIX + 'trusted');

    global.twitchAuthStorage = twitchAuthStorage;
    global.commandsStorage = commandsStorage;
    global.trustedStorage = trustedStorage;

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    mainWindow.loadURL(startUrl);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    mainWindow.webContents.openDevTools();

    global.mainWindow = mainWindow;

    const expressServer = new ExpressServer(EXPRESS_PORT);
    expressServer.start()
        .then(() => {
            console.log(`Express server listening at 'http://localhost:${global.expressServerPort}'`);
        })
        .catch(error => {
            console.error(`ERROR: Could not start express server`);
            console.error(error);

            if (error.startsWith('[LCU_TIMEOUT]')) {
                electron.dialog.showErrorBox(
                    'LCU data reading timed out',
                    'This is probably because no open League client could be found. Please make sure your League client is running and restart this app.'
                );
            } else {
                mainWindow.close();
            }
        });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', onAppReady);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        onAppReady()
    }
});

const onAutoUpdateEvent = (event, data) => {
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('AUTO_UPDATER_EVENT', event, data);
    });
};

autoUpdater.on('update-downloaded', (info) => {
    onAutoUpdateEvent('update-downloaded', info);
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 5000);
});

class ExpressServer {
    constructor(port) {
        this.port = port;
        global.expressServerPort = port;
        this.lcuConnector = new LCUConnector();
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                const server = express();

                server.use(cors());
                server.use(express.json());

                server.get('/', (req, res) => {
                    res.send('Hello, world!');
                });

                server.get('/request', async (req, res) => {
                    this.handleRequest({req, res, method: 'GET'});
                });

                server.post('/request', (req, res) => {
                    this.handleRequest({req, res, method: 'POST', options: {body: JSON.stringify(req.body), headers: {'Content-Type': 'application/json'}}});
                });

                server.put('/request', (req, res) => {
                    this.handleRequest({req, res, method: 'PUT', options: {body: JSON.stringify(req.body), headers: {'Content-Type': 'application/json'}}});
                });

                server.patch('/request', (req, res) => {
                    this.handleRequest({req, res, method: 'PATCH', options: {body: JSON.stringify(req.body), headers: {'Content-Type': 'application/json'}}});
                });

                server.get('/twitch/oauth/redirect', async (req, res) => {
                    const {code} = req.query;

                    let accessToken = await this.fetchTwitchAccessToken(code);
                    accessToken = {
                        ...accessToken,
                        expiresAt: Date.now() + (accessToken.expires_in * 1000)
                    };

                    global.mainWindow.webContents.send('gotTwitchAccessToken', accessToken);
                });

                server.listen(this.port, async () => {
                    global.serverUrl = `http://localhost:${this.port}`;

                    this.lcuConnector.on('connect', data => {
                        console.log('LCU data: ', data);

                        global.LCU_data = data;
                        global.LCU_auth = `${btoa(`${global.LCU_data.username}:${global.LCU_data.password}`)}`;

                        resolve(true);
                    });

                    this.lcuConnector.on('disconnect', () => {
                        console.warn(`WARN: LCU connector disconnected.`);
                    });

                    this.lcuConnector.start();

                    // TODO: [later] Mention the timeout in UI
                    // TODO: [later] Allow user to customize duration to timeout
                    // TODO: Figure out a nicer way to signal timeout to UI
                    setTimeout(() => {
                        reject(`[LCU_TIMEOUT]: Express server timed out while attempting to read LCU data. Probably because no running League Client was found.`);
                    }, 10000);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async handleRequest({req, res, method = 'GET', options = {}}) {
        const {endpoint} = req.query;
        console.log(`Handling [${method}] request for endpoint '${endpoint}'...`);

        const response = await this.sendRequest(endpoint, {method: method, ...options});
        const status = (response && response.httpStatus) || 200;

        res.status(status).send(response);
    };

    sendRequest(endpoint, options) {
        const {protocol, address, port} = global.LCU_data;
        const url = `${protocol}://${address}:${port}${endpoint}`;

        options = {
            ...options,
            headers: {
                ...options.headers,
                Accept: 'application/json',
                Authorization: `Basic ${global.LCU_auth}`
            }
        };

        return fetch(url, options)
            .then(jsonResponse)
            .catch(err => console.log(`ERROR: `, err));
    };

    fetchTwitchAccessToken(code) {
        const url = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_APP_CLIENT_ID}&client_secret=${TWITCH_APP_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${TWITCH_REDIRECT_URL}`;

        return fetch(url, {method: 'POST'})
            .then(jsonResponse)
            .catch(console.error);
    };
}