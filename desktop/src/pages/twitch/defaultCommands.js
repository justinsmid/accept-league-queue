import {getGlobal, includesIgnoreCase, splitFirst, jsonResponse, equalsIgnoreCase} from '../../util/util';

const findArg = (target, args) => args.find(arg => includesIgnoreCase(target, arg));
const findAndParseArg = (target, args) => {
    const split = splitFirst(findArg(target, args), '=');

    return split ? split[1] : null;
};

export const stringifyCommands = commands => {
    if (!commands) return null;

    // return JSON.stringify(commands, (key, val) => typeof val === 'function' ? val.toString() : val);
    return JSON.stringify(commands);
};

export const parseStringifiedCommands = commandsStr => {
    if (!commandsStr) return null;

    // eslint-disable-next-line
    // return JSON.parse(commandsStr, (key, val) => key === 'execute' ? eval(val) : val);

    const commands = JSON.parse(commandsStr);

    // TODO: Store commands[execute]. This is a workaround and only works for default commands.
    Object.entries(commands).forEach(([key, command]) => {
        commands[key] = {
            ...command,
            execute: defaultCommands[key].execute
        };
    });

    return commands;
};

// TODO: Custom - custom list of viewers
export const RequiredRole = Object.freeze({
    BROADCASTER: 'Broadcaster',
    TRUSTED_PLUS: 'Trusted+',
    TRUSTED: 'Trusted',
    MODS_PLUS: 'Mods+',
    MODS: 'Mods',
    SUBSCRIBERS_PLUS: 'Subscribers+',
    SUBSCRIBERS: 'Subscribers',
    FOLLOWERS_PLUS: 'Followers+',
    FOLLOWERS: 'Followers',
    ANYONE: 'Anyone'
});

export const ArgumentFormat = Object.freeze({
    ORDERED: 'Ordered',
    NAMED: 'Named'
});

export const argumentFormatExplanation = format => {
    const ending = `Each argument should be a single string with no spaces.`;
    switch (format) {
        case ArgumentFormat.ORDERED:
            return `Ordered - Arguments should be given in the specified order. ${ending}`;
        case ArgumentFormat.NAMED:
            return `Named - Arguments should be prefixed with '<name>=' and can be given in any order. ${ending}`;
        default: throw new Error(`Argument format '${format}' not explained`);
    }
};

// TODO: Perform checks for command args more properly, and for all commands that take args
export const defaultCommands = {
    'ping': {
        name: 'ping',
        enabled: true,
        description: 'Makes the bot console.log \'pong\'. Can be used to check whether the bot is correctly connected to chat.',
        argumentData: null,
        format: '!lcu ping',
        requiredRole: RequiredRole.ANYONE,
        execute: () => {
            console.log('[Twitch bot]: Pong');
        }
    },
    'trust': {
        name: 'Trust user',
        enabled: true,
        description: 'Adds the given user to the list of trusted users.',
        argumentData: {
            format: ArgumentFormat.ORDERED,
            requiredArguments: [
                {
                    name: 'username',
                    type: 'string',
                    description: 'Name of the user to trust.'
                }
            ]
        },
        format: '!lcu trust <username>',
        requiredRole: RequiredRole.TRUSTED_PLUS,
        execute: (args, twitchBot, msgSenderData, ircChannel) => {
            if (args.length === 0) {
                console.error(`Argument 'username' not provided for command 'trust'`);
                twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, please provide a username for command 'trust'`);
                return;
            }

            const username = args[0];

            if (!twitchBot.pageRef.state.trustedUsers.some(trustedUser => equalsIgnoreCase(trustedUser, username))) {
                console.log(`[Twitch bot]: Trusting user '${username}'...`);
                twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, '${username}' is now trusted.`);

                return twitchBot.pageRef.addTrustedUser(username);
            } else {
                twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, the user '${username}' is already trusted.`);
                console.log(`[Twitch bot]: user '${username}' is already trusted.`);
            }
        }
    },
    'accept-queue': {
        name: 'Accept queue',
        enabled: true,
        description: 'Accepts the League queue if there is one that can currently be accepted.',
        argumentData: null,
        format: '!lcu accept-queue',
        requiredRole: RequiredRole.MODS_PLUS,
        execute: (args, twitchBot, msgSenderData, ircChannel) => {
            console.log('[Twitch bot]: Accepting queue...');
            const url = `${getGlobal('serverUrl')}/request?endpoint=/lol-matchmaking/v1/ready-check/accept`;
            return fetch(url, {method: 'POST'})
                .then(res => {
                    switch (res.status) {
                        case 404:
                            console.error('Attempted to accept queue, but no active queue was found.');
                            twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, no active queue found to accept.`);
                            return res;
                        case 500:
                            console.error('Attempted to accept queue, but the current queue has not popped yet.');
                            twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, the current queue has not popped yet.`);
                            return res;
                        case 200:
                        default: return res;
                    }
                });
        }
    },
    'decline-queue': {
        name: 'Decline queue',
        enabled: true,
        description: 'Declines the League queue if there is one that can currently be declined.',
        argumentData: null,
        format: '!lcu decline-queue',
        requiredRole: RequiredRole.MODS_PLUS,
        execute: (args, twitchBot, msgSenderData, ircChannel) => {
            console.log('[Twitch bot]: Declining queue...');
            const url = `${getGlobal('serverUrl')}/request?endpoint=/lol-matchmaking/v1/ready-check/decline`;
            return fetch(url, {method: 'POST'})
                .then(res => {
                    switch (res.status) {
                        case 404:
                            console.error('Attempted to decline queue, but no active queue was found.');
                            twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, no active queue found to decline.`);
                            return res.json();
                        case 500:
                            console.error('Attempted to decline queue, but the current queue has not popped yet.');
                            twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, the current queue has not popped yet.`);
                            return res.json();
                        case 200:
                        default: return res;
                    }
                });
        }
    },
    'hover-champ': {
        name: 'Hover champion',
        enabled: true,
        description: 'Hovers the given champion. Only works if the user is currently in champion select, and it is his turn to pick a champion.',
        argumentData: {
            format: ArgumentFormat.ORDERED,
            requiredArguments: [
                {
                    name: 'champion',
                    type: 'string | integer',
                    description: 'Name (string) or id (integer) of the champion. does not have to be the full name, for example: if you want to hover Dr. Mundo, typing \'mundo\' will work, whereas \'dr mundo\' will not, because that makes it 2 seperate words.'
                }
            ]
        },
        format: '!lcu hover-champ <champion>',
        requiredRole: RequiredRole.SUBSCRIBERS_PLUS,
        execute: (args, twitchBot, msgSenderData, ircChannel) => pickChamp(args, false, 'hover-champ', twitchBot, msgSenderData, ircChannel)
    },
    'lock-champ': {
        name: 'Lock in champion',
        enabled: true,
        description: 'Lock in the given champion. Only works if the user is currently in champion select, and it is his turn to pick a champion.',
        argumentData: {
            format: ArgumentFormat.ORDERED,
            requiredArguments: [
                {
                    name: 'champion',
                    type: 'string | integer',
                    description: 'Name (string) or id (integer) of the champion. does not have to be the full name, for example: if you want to hover Dr. Mundo, typing \'mundo\' will work, whereas \'dr mundo\' will not, because that makes it 2 seperate words.'
                }
            ]
        },
        format: '!lcu lock-champ <champion>',
        requiredRole: RequiredRole.TRUSTED_PLUS,
        execute: (args, twitchBot, msgSenderData, ircChannel) => pickChamp(args, true, 'lock-champ', twitchBot, msgSenderData, ircChannel)
    },
    'request': {
        name: 'Send custom request',
        enabled: true,
        description: 'Allows the chat user to send a custom request to the LCU API (API that the bot uses to interact with the League client).',
        argumentData: {
            format: ArgumentFormat.NAMED,
            requiredArguments: [
                {
                    name: 'endpoint',
                    type: 'string',
                    description: 'Endpoint of the LCU API that you want to send a request to. An overview of of the available endpoints can be found at http://lcu.vivide.re/'
                },
                {
                    name: 'method',
                    type: 'string',
                    description: 'HTTP request method. Currently supported options are: [get, post, put, patch]'
                },
                {
                    name: 'returnsJson',
                    type: 'boolean',
                    description: 'Whether the request is expected to return json data'
                }
            ],
            optionalArguments: [
                {
                    name: 'body',
                    type: 'object',
                    description: 'Data to be sent along with the request. Cannot be specified for GET-requests'
                },
                {
                    name: 'headers',
                    type: 'object',
                    description: 'Headers to be sent along with the request. Will automatically include \'Content-type: application/json\' if a body is given'
                }
            ]
        },
        format: '!lcu request endpoint=<endpoint> method=<method> returnsJson=<returnsJson> body=<body> headers=<headers>',
        requiredRole: RequiredRole.TRUSTED_PLUS,
        execute: args => {
            console.log('[Twitch bot]: handing request with args', args);

            const argNotFound = (wanted, found) => {
                console.error(`Required argument '${wanted}' not found. Instead got '${found}'`);
                return;
            };

            const method = findAndParseArg('method=', args);
            if (!method) return argNotFound('method', method);

            const endpoint = findAndParseArg('endpoint=', args);
            if (!endpoint) return argNotFound('endpoint', endpoint);

            const returnsJson = findAndParseArg('returnsJson=', args);
            if (returnsJson === null) return argNotFound('returnsJson', returnsJson);

            const body = findAndParseArg('body=', args);
            const headers = findAndParseArg('headers=', args);

            const url = `${getGlobal('serverUrl')}/request?endpoint=${endpoint}`;

            let options = {method};
            if (headers) options.headers = headers;
            if (body) {
                options.body = body;
                options.headers = {'Content-Type': 'application/json', ...options.headers};
            };

            return fetch(url, options)
                .then(res => returnsJson === true ? jsonResponse(res) : res)
                .then(res => {
                    console.log('[Twitch bot]: Finished custom request', res);
                })
                .catch(err => {
                    console.error(`[Twitch bot - ERROR]: Error occurred during custom [${method}] request to endpoint '${endpoint}'`);
                    console.error(err);
                });
        }
    }
};

const getChampionId = async ({arg, summonerId}) => {
    if (!arg) {
        console.error('No arg given for getChampion()');
        return null;
    }

    const champions = await fetch(`${getGlobal('serverUrl')}/request?endpoint=/lol-champions/v1/inventories/${summonerId}/champions`).then(jsonResponse);
    console.log('All champions: ', champions);

    if (isNaN(arg)) {
        const championsWithMatchingNames = champions.filter(champion => (
            includesIgnoreCase(arg, champion.name)
        ));
        return championsWithMatchingNames[0].id;
    } else {
        const championId = parseInt(arg);
        const championsWithMatchingId = champions.filter(champion => (
            champion.id === championId
        ));
        return championsWithMatchingId[0].id;
    }
};

// TODO: handle multiple champs that include given name, champion not being available
const pickChamp = async (args, lockIn = false, command, twitchBot, msgSenderData, ircChannel) => {
    console.clear();
    console.log('[Twitch bot]: Picking champion...');

    if (args.length === 0) {
        console.error(`Argument 'champion' not provided for command '${command}'`);
        twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, please provide a champion for command '${command}'`);
        return;
    }

    const me = await fetch(`${getGlobal('serverUrl')}/request?endpoint=/lol-chat/v1/me`).then(jsonResponse);
    const mySummonerId = me.summonerId;
    console.log('me', mySummonerId);

    const championId = await getChampionId({arg: args[0], summonerId: mySummonerId});
    if (!championId) {
        console.error(`Could not find a champion matching ${args[0]}`);
        twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, could not find a champion matching '${args[0]}'`);
        return;
    }
    console.log('Got championId', championId);

    const champSelectSession = await fetch(`${getGlobal('serverUrl')}/request?endpoint=/lol-champ-select/v1/session`)
        .then(async res => {
            console.log('champ select session res before .json()', res);
            res = await res.json();
            console.log('champ select session res after .json()', res);
            console.log(res, res.httpStatus === 404);
            const returnValue = res.httpStatus === 404 ? null : res;
            console.log('returnValue', returnValue);
            return returnValue;
        });
    if (!champSelectSession) {
        console.error(`No active champion select found`);
        twitchBot.client.say(ircChannel, `@${msgSenderData['display-name']}, no active champion select found.`);
        return;
    }

    const actions = champSelectSession.actions;

    console.log('champ select session', champSelectSession, actions);

    const meInSession = champSelectSession.myTeam.find(summoner => summoner.summonerId === mySummonerId);
    console.log('me in sesion', meInSession);

    const myCellId = meInSession.cellId;
    console.log('My cell id', myCellId);

    const myAction = actions.find(actions => (actions.find(action =>
        action.isAllyAction && action.type === "pick" && action.actorCellId === myCellId
    )))[0];
    console.log('my action', myAction);

    const url = `${getGlobal('serverUrl')}/request?endpoint=/lol-champ-select/v1/session/actions/${myAction.id}`;

    return fetch(url, {
        method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: `{"championId": ${championId},"completed": ${lockIn}}`
    })
        .then(console.log)
        .catch(console.error);
};