const express = require('express');
const fetch = require('node-fetch');
const LCUConnector = require('lcu-connector');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

Buffer = Buffer || require('buffer').Buffer;

const lcuConnector = new LCUConnector();

const app = express();
const port = 3000;

const btoa = string => Buffer.from(string).toString('base64');

const get = endpoint => {
    const url = `https://127.0.0.1:${global.LCU_data.port}${endpoint}`;

    return fetch(url, {
        headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`
        }
    })
        .then(res => res.json())
        .then(res => {
            console.log(`Request finished`, res);
            return res;
        })
        .catch(err => console.log(`ERROR: `, err));
}

const post = endpoint => {
    const url = `https://127.0.0.1:${global.LCU_data.port}${endpoint}`;

    return fetch(url, {
        headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`
        },
        method: 'POST'
    })
        .then(res => res.json())
        .then(res => {
            console.log(`Request finished`, res);
            return res;
        })
        .catch(err => console.log(`ERROR: `, err));
};

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/get', async (req, res) => {
    const { endpoint } = req.query;
    
    const response = await get(endpoint);
    console.log('GET response', response);

    res.json(response);
});

app.post('/get', async (req, res) => {
    const { endpoint } = req.query;
    
    const response = await post(endpoint);
    console.log('POST response', response);

    res.json(response);
});

app.listen(port, () => {
    lcuConnector.on('connect', data => {
        console.log('LCU data: ', data);
        
        global.LCU_data = data;
        global.LCU_username = 'riot';
        global.LCU_auth = `${btoa(`${global.LCU_username}:${global.LCU_data.password}`)}`;
    });
!
    lcuConnector.on('disconnect', () => {
        console.warn(`WARN: LCU connector disconnected.`);
    });

    lcuConnector.start();
    
    console.log(`Example app listening at http://localhost:${port}`);
});