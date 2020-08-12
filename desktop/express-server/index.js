const express = require('express');
const fetch = require('node-fetch');
const LCUConnector = require('lcu-connector');
const ngrok = require('ngrok');

Buffer = Buffer || require('buffer').Buffer;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const btoa = string => Buffer.from(string).toString('base64');

let lcuConnector;

const PORT = 6969;
let server;

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
                setTimeout(() => {
                    reject(`Express server timed out while attempting to read LCU data. Probably because no running League Client was found.`);   
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
        .then(res => res.json())
        .catch(err => console.log(`ERROR: `, err));
};