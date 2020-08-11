const express = require('express');
const fetch = require('node-fetch');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

Buffer = Buffer || require('buffer').Buffer;

const LCU_username = 'riot';
const [LCU_process, LCU_PID, LCU_port, LCU_password, LCU_protocol] = 'LeagueClient:17840:58489:z_3kZYgsM0JtqYsOYvfgHg:https'.split(':');

const app = express();
const port = 3000;

const btoa = string => Buffer.from(string).toString('base64');

const auth = `${btoa(`${LCU_username}:${LCU_password}`)}`;

const get = endpoint => {
    const url = `https://127.0.0.1:${LCU_port}${endpoint}`;

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
    const url = `https://127.0.0.1:${LCU_port}${endpoint}`;

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
    console.log(`Example app listening at http://localhost:${port}`);
});