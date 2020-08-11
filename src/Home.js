import React, {useState, useEffect} from 'react';
import {View, Button, StyleSheet, Text} from 'react-native';

const SERVER_URL = 'https://a0981b6a4528.ngrok.io';

export default (props, context) => {
    const [matchFound, setMatchFound] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    const handleMatchFound = () => {
        setMatchFound(true);
        removeInterval();
    };

    const enableInterval = () => {
        setIntervalId(setInterval(() => {
            checkAndHandleReadyCheck({
                onMatchFound: handleMatchFound
            });
        }, 1000));
    };

    const removeInterval = () => {
        clearInterval(intervalId);
    };

    const acceptMatch = async () => {
        await post('/lol-matchmaking/v1/ready-check/accept');

        console.log(`Accepted queue`);
    };

    const declineMatch = async () => {
        await post('/lol-matchmaking/v1/ready-check/decline');

        console.log(`Declined queue`);
    };

    useEffect(enableInterval, []);

    return (
        <View>
            {/* {matchFound ?
                <View>
                    <Button title='Accept' color='green' onPress={acceptMatch} />
                    <Button title='Decline' color='red' onPress={declineMatch} />
                </View>
                : <View>
                    <Button title='Cancel interval' onPress={removeInterval} />
                    <Button title='Enable interval' onPress={enableInterval} />
                </View>
            } */}
            {matchFound ?
                <View style={styles.buttonContainer}>
                    <Button title='Accept' color='green' style={{margin: '20px'}} onPress={acceptMatch} />
                    <Button title='Decline' color='red' style={{margin: '20px'}} onPress={declineMatch} />
                </View>
                : <Text>Waiting for queue pop...</Text>}
        </View>
    );
};

const checkAndHandleReadyCheck = async ({onMatchFound}) => {
    const res = await get('/lol-matchmaking/v1/ready-check');

    if (!('state' in res)) return;            // Not in queue
    else if (res.state === 'Invalid') return; // In queue, searching
    else if (res.state === 'InProgress') {    // Queue popped
        onMatchFound();
        return;
    }
};

const get = (endpoint) => {
    const url = `${SERVER_URL}/get?endpoint=${endpoint}`;
    console.log(`[GET] Fetching '${url}'...`);

    return fetch(url)
        .then(res => res.json())
        .then(res => {
            console.log(`Request finished`, res);
            return res;
        });
};

const post = (endpoint) => {
    const url = `${SERVER_URL}/get?endpoint=${endpoint}`;
    console.log(`[POST] Fetching '${url}'...`);

    return fetch(url, {method: 'POST'});
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row'
    }
});