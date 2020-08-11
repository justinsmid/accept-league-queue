// TODO: Have user give server url rather than hardcoding it.
const SERVER_URL = 'https://05c19577f6ed.ngrok.io';

const jsonResponse = res => res.json();

export const get = endpoint => {
    const url = `${SERVER_URL}/request?endpoint=${endpoint}`;
    console.log(`[GET] Fetching '${url}'...`);

    return fetch(url).then(jsonResponse);
};

export const post = endpoint => {
    const url = `${SERVER_URL}/request?endpoint=${endpoint}`;
    console.log(`[POST] Fetching '${url}'...`);

    return fetch(url, {method: 'POST'});
}