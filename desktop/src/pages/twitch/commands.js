import {getGlobal, includesIgnoreCase, splitFirst, jsonResponse} from '../../util/util';

const findArg = (target, args) => args.find(arg => includesIgnoreCase(target, arg));
const findAndParseArg = (target, args) => {
    const split = splitFirst(findArg(target, args), '=');

    return split ? split[1] : null;
};

export const commands = {
    'ping': () => {
        console.log('[Twitch bot]: Pong');
    },
    'accept-queue': () => {
        console.log('[Twitch bot]: Accepting queue...');
        const url = `${getGlobal('serverUrl')}/request?endpoint=/lol-matchmaking/v1/ready-check/accept`;
        return fetch(url, {method: 'POST'});
    },
    'decline-queue': () => {
        console.log('[Twitch bot]: Declining queue...');
        const url = `${getGlobal('serverUrl')}/request?endpoint=/lol-matchmaking/v1/ready-check/decline`;
        return fetch(url, {method: 'POST'});
    },
    'hover-champ': args => pickChamp(args, false),
    'lock-champ': args => pickChamp(args, true),
    'request': args => {
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

const pickChamp = async (args, lockIn = false) => {
    console.clear();
    console.log('[Twitch bot]: Picking champion...');

    if (args.length === 0 || args.length > 1) {
        console.error(`1 argument expected for pickChamp: championId or championName but instead got ${args.length}`, args);
        return;
    }

    const me = await fetch(`${getGlobal('serverUrl')}/request?endpoint=/lol-chat/v1/me`).then(jsonResponse);
    const mySummonerId = me.summonerId;
    console.log('me', mySummonerId);

    const championId = await getChampionId({arg: args[0], summonerId: mySummonerId});
    if (!championId) {
        console.error(`Could not find a champion matching ${args[0]}`);
        return;
    }
    console.log('Got championId', championId);

    const champSelectSession = await fetch(`${getGlobal('serverUrl')}/request?endpoint=/lol-champ-select/v1/session`)
        .then(async res => {
            res = await res.json();
            console.log(res, res.httpStatus === 404);
            const returnValue = res.httpStatus === 404 ? null : res;
            console.log('returnValue', returnValue);
            return returnValue;
        });
    if (!champSelectSession) {
        console.error(`No active champion select found`);
        return;
    }

    const actions = champSelectSession.actions;

    console.log('champ select session', champSelectSession, champSelectSession.actions);

    const meInSession = champSelectSession.myTeam.find(summoner => summoner.summonerId === mySummonerId);
    console.log('me in sesion', meInSession);

    const myCellId = meInSession.cellId;
    console.log('My cell id', myCellId);

    const myAction = champSelectSession.actions.find(actions => (actions.find(action => 
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