import pg from 'pg';
import { pgClient } from '../app'
import HttpStatus from 'http-status-codes';
import { ChillUser, ChillNumericMetric, PrettyChillUser } from '../../db/models/models';
import express from 'express';

export function validateUuid(inStr : string) {
    const regexResult : RegExpMatchArray | null = inStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    return regexResult;
}

export function validateUsername(inStr: string) {
    const regexResult : RegExpMatchArray | null = inStr.match(/^[a-z0-9_]{3,16}$/gi);
    return regexResult;
}

export function getChillStats(inStr: string) : Promise<PrettyChillUser> {
    return new Promise(async (resolve, reject) => {
        const regexResult = validateUuid(inStr);
        if (regexResult == null) {
            reject({httpError: HttpStatus.BAD_REQUEST, chillError: ChillError.INVALID_UUID});
            return;
        }

        const userCheck : pg.QueryResult = await pgClient.query(`SELECT * FROM ChillUser WHERE uuid = $1`, [inStr]);
        
        if (userCheck.rowCount === 0) {
            reject({httpError: HttpStatus.NOT_FOUND, chillError: ChillError.NO_USER});
            return;
        }

        const retrievedUser : ChillUser = userCheck.rows[0];
        
        const metricCheck : pg.QueryResult = await pgClient.query(`SELECT * FROM ChillNumericMetric WHERE uuid = $1 AND metric IN ($2, $3)`, [inStr, 'wins', 'losses']);
        
        const wins : {gametype: string, amount: number}[] = [];
        const losses : {gametype: string, amount: number}[] = [];

        for (let row of metricCheck.rows) {
            if (row == null) continue;
            const castedRow = <ChillNumericMetric> row;
            const filteredMetric : {gametype: string, amount: number} = {gametype: castedRow.gametype, amount: castedRow.amount};
            if (castedRow.metric === 'wins') wins.push(filteredMetric);
            else losses.push(filteredMetric);
        }

        const prettyChillUser : PrettyChillUser = {
            uuid: inStr,
            wins: wins,
            losses: losses,
            matches: retrievedUser.matches,
            coins: retrievedUser.coins,
            level: retrievedUser.level,
            username: retrievedUser.username
        } 

        resolve(prettyChillUser);
    });
}

export function assembleDynamicUpdateParams(tablename : string, cols : object, filterKey : string, filterValue : string) {
    // Setup static beginning of query
    var query = ['UPDATE ' + tablename];
    query.push('SET');
  
    // Create another array storing each set command
    // and assigning a number value for parameterized query
    var set : string[] = [];
    Object.keys(cols).forEach(function (key, i) {
      set.push(key + ' = ($' + (i + 1) + ')'); 
    });
    query.push(set.join(', '));
  
    // Add the WHERE statement to look up by the filter id/value
    query.push('WHERE ' + filterKey + ' = ' + filterValue);
  
    // Return a complete query string
    return query.join(' ');
}

export function createChillStats(inUuid: string, username: string, skipUuidCheck: boolean) : Promise<PrettyChillUser> {
    return new Promise(async (resolve, reject) => {
        if (!skipUuidCheck) {
            const regexResult = validateUuid(inUuid);
            if (regexResult == null) {
                reject({httpError: HttpStatus.BAD_REQUEST, chillError: ChillError.INVALID_UUID});
                return;
            }
        }

        const usernameResult = validateUsername(username);
        if (usernameResult == null) {
            reject({httpError: HttpStatus.BAD_REQUEST, chillError: ChillError.INVALID_USERNAME});
            return;
        }

        await pgClient.query(`INSERT INTO ChillUser(uuid, username) VALUES($1, $2)`, [inUuid, username]);
        

        let chillStats : PrettyChillUser;
        try {
            chillStats = await getChillStats(inUuid);
        } catch(e) {
            reject({httpError: HttpStatus.INTERNAL_SERVER_ERROR, chillError: ChillError.INTERNAL_ERROR});
            return;
        }
        resolve(chillStats);
    });
}

export function badRequestWrapper(res: express.Response, message: string) {
    return res.status(HttpStatus.BAD_REQUEST).send({error: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST), message: message});
}

export function parseChillError(httpStatusCode: number, chillErr: string | null) {
    const httpError : string = HttpStatus.getStatusText(httpStatusCode);
    return (chillErr == null ? {error: httpError} : {error: httpError, message: chillErr});
}


export const ChillError = Object.freeze({
    "INVALID_UUID": "UUID is not valid",
    "NO_USER": "No user profile found",
    "INTERNAL_ERROR": null,
    "INVALID_GAMETYPE": "Not a valid gametype",
    "NO_MATCH": "No match found",
    "GAMEMODE_LEADERBOARD_NOT_SUPPORTED": "Gamemode leaderboards are not implemented yet",
    "INVALID_USERNAME": "Invalid username"
});