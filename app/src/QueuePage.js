import React, {Component} from 'react';
import {View, Button, StyleSheet, Text} from 'react-native';
import {get, post} from './api';
import Page from './Page';

const QueueStatus = Object.freeze({
    NOT_IN_QUEUE: 0,
    IN_QUEUE: 1,
    MATCH_FOUND: 2
});

export default class QueuePage extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            queueStatus: QueueStatus.NOT_IN_QUEUE,
            intervalId: null,
            runningInterval: false,
        };

        this.handleQueueStateInterval = this.handleQueueStateInterval.bind(this);
        this.enableIntervalIfNeeded = this.enableIntervalIfNeeded.bind(this);
        this.removeInterval = this.removeInterval.bind(this);
        this.pauseIntervalFor = this.pauseIntervalFor.bind(this);
        this.acceptMatch = this.acceptMatch.bind(this);
        this.declineMatch = this.declineMatch.bind(this);
        this.checkQueueStatus = this.checkQueueStatus.bind(this);
    }

    async componentDidMount() {
        this.enableIntervalIfNeeded();
    }

    componentWillUnmount() {
        this.removeInterval();
    }

    async handleQueueStateInterval() {
        const queueStatus = await this.checkQueueStatus();

        if (queueStatus === QueueStatus.MATCH_FOUND) {
            this.removeInterval();
        } else {
            this.enableIntervalIfNeeded();
        }

        this.setState({queueStatus});
    }

    enableIntervalIfNeeded() {
        // TODO: [later] Make interval timer configurable in UI.
        if (!this.state.runningInterval) {
            const intervalId = setInterval(this.handleQueueStateInterval, 3000);

            this.setState({intervalId, runningInterval: true});
        }
    }

    removeInterval() {
        clearInterval(this.state.intervalId);
        this.setState({runningInterval: false})
    }

    pauseIntervalFor(ms) {
        this.removeInterval();
        setTimeout(this.handleQueueStateInterval, ms);
    }

    async acceptMatch() {
        await post('/lol-matchmaking/v1/ready-check/accept');

        // TODO: [later] This might make user miss queue when accepting last-second, waiting for the entire next pop to resume interval.
        // Fix it by tracking when queue popped, and subtracting it from the timer
        this.pauseIntervalFor(18000);

        console.log(`Accepted queue`);
    }

    async declineMatch() {
        await post('/lol-matchmaking/v1/ready-check/decline');

        // TODO: [later] This might make user miss queue when declining last-second, waiting for the entire next pop to resume interval.
        // Fix it by tracking when queue popped, and subtracting it from the timer
        this.pauseIntervalFor(18000);

        console.log(`Declined queue`);
    }

    async checkQueueStatus() {
        const res = await get('/lol-matchmaking/v1/ready-check');

        if (!('state' in res)) return QueueStatus.NOT_IN_QUEUE;

        switch (res.state) {
            case 'Invalid': return QueueStatus.IN_QUEUE;
            case 'InProgress': return QueueStatus.MATCH_FOUND;
            default: return QueueStatus.NOT_IN_QUEUE;
        }
    }

    render() {
        const {queueStatus} = this.state;

        console.log('Queue state: ', queueStatus);

        return (
            <Page>
                {queueStatus === QueueStatus.NOT_IN_QUEUE ?
                    <Text>You are currently not in queue.{'\n'}
                          Please queue up using the League client.</Text>
                : queueStatus === QueueStatus.IN_QUEUE ?
                    <Text>In queue, waiting for a match...</Text>
                : queueStatus === QueueStatus.MATCH_FOUND ?
                    <View>
                        <Text>Match found!</Text>
                        <View style={styles.buttonContainer}>
                            {/* TODO: Make UI respond to accepting/declining match immediately. */}
                            <Button title='Accept'  color='green' onPress={this.acceptMatch} />
                            <Button title='Decline' color='red'   onPress={this.declineMatch} />
                        </View>
                    </View>
                : <Text>ERROR: queueStatus '{queueStatus}' unknown</Text>}
            </Page>
        );
    }
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
});