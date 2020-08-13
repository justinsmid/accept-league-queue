const express = require('express');
const fetch = require('node-fetch');
const LCUConnector = require('lcu-connector');
const ngrok = require('ngrok');

Buffer = Buffer || require('buffer').Buffer;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const btoa = string => Buffer.from(string).toString('base64');
const jsonResponse = res => res.json();

let lcuConnector;

const PORT = 6969;
let server;

const TWITCH_APP_CLIENT_ID = 'vgg3y1iox13ljlp25hogabv408qz0m';
const TWITCH_APP_CLIENT_SECRET = 'apl0hcj3qpdb5bialb7hq3twhoruol'; // TODO: Hide this.
const TWITCH_REDIRECT_URL = `http://localhost:${PORT}/twitch/oauth/redirect`;

module.exports.startExpressServer = () => {
    return new Promise((resolve, reject) => {
        try {
            lcuConnector = new LCUConnector();
            server = express();
            global.expressServerPort = PORT;

            server.get('/', (req, res) => {
                res.send('Hello, world!');
            });

            server.get('/request', async (req, res) => {
                handleRequest(req, res, 'GET');
            });

            server.post('/request', (req, res) => {
                handleRequest(req, res, 'POST');
            });

            server.get('/twitch/oauth/redirect', async (req, res) => {
                const {code} = req.query;

                const accessToken = await fetchTwitchAccessToken(code);

                global.twitchAuthStorage.setItem('accessToken', JSON.stringify(accessToken));
                
                global.mainWindow.webContents.send('gotTwitchAccessToken', accessToken);
            });

            server.listen(PORT, async () => {
                global.ngrokUrl = await ngrok.connect(PORT);

                lcuConnector.on('connect', data => {
                    console.log('LCU data: ', data);

                    global.LCU_data = data;
                    global.LCU_auth = `${btoa(`${global.LCU_data.username}:${global.LCU_data.password}`)}`;

                    resolve(true);
                });

                lcuConnector.on('disconnect', () => {
                    console.warn(`WARN: LCU connector disconnected.`);
                });

                lcuConnector.start();

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
};

const handleRequest = async (req, res, type = 'GET') => {
    const {endpoint} = req.query;
    console.log(`Handling [${type}] request for endpoint '${endpoint}'...`);

    const response = await sendRequest(endpoint, {method: type});

    console.log(`Response for endpoint '${endpoint}': `, response);

    res.json(response);
};

const sendRequest = (endpoint, options = {}) => {
    const {protocol, address, port} = global.LCU_data;
    const url = `${protocol}://${address}:${port}${endpoint}`;

    options = {
        ...options,
        headers: {
            Accept: 'application/json',
            Authorization: `Basic ${global.LCU_auth}`
        }
    };

    return fetch(url, options)
        .then(jsonResponse)
        .catch(err => console.log(`ERROR: `, err));
};

const fetchTwitchAccessToken = code => {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_APP_CLIENT_ID}&client_secret=${TWITCH_APP_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${TWITCH_REDIRECT_URL}`;

    return fetch(url, {method: 'POST'})
        .then(jsonResponse)
        .catch(console.error);
};