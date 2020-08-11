const express = require('express');
const fetch = require('node-fetch');
const LCUConnector = require('lcu-connector');

Buffer = Buffer || require('buffer').Buffer;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const lcuConnector = new LCUConnector();

const btoa = string => Buffer.from(string).toString('base64');

const app = express();
const PORT = 3000;

app.get('/request', async (req, res) => {
    handleRequest(req, res, 'GET');
});

app.post('/request', (req, res) => {
    handleRequest(req, res, 'POST');
});

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

app.listen(PORT, () => {
    lcuConnector.on('connect', data => {
        console.log('LCU data: ', data);

        global.LCU_data = data;
        global.LCU_auth = `${btoa(`${global.LCU_data.username}:${global.LCU_data.password}`)}`;
    });
    
    lcuConnector.on('disconnect', () => {
        console.warn(`WARN: LCU connector disconnected.`);
    });

    lcuConnector.start();

    console.log(`Example app listening at http://localhost:${PORT}`);
});