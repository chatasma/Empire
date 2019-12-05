import pg from 'pg';
import { pgClient } from '../app'
import HttpStatus from 'http-status-codes';

export function validateUuid(inStr : string) {
    const regexResult : RegExpMatchArray | null = inStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    return regexResult;
}

export function getChillStats(inStr: string) {
    return new Promise(async (resolve, reject) => {
        const regexResult = validateUuid(inStr);
        if (regexResult == null) {
            reject({httpError: HttpStatus.BAD_REQUEST, chillError: ChillError.INVALID_UUID});
            return;
        }
        const initialDbCheck : pg.QueryResult = await pgClient.query(`SELECT * FROM ChillUser WHERE uuid = '${inStr}';`);
        if (initialDbCheck.rowCount === 0) {
            reject({httpError: HttpStatus.BAD_REQUEST, chillError: ChillError.NO_USER});
            return;
        }
        const statsDbCheck : pg.QueryResult = await pgClient.query(`SELECT * FROM ChillStats WHERE id = '${initialDbCheck.rows[0].stats}'`);
        const chillUser = initialDbCheck.rows[0];
        chillUser.stats = statsDbCheck.rows[0];
        resolve(chillUser);
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

export function createChillStats(inStr: string, skipUuidCheck: boolean) {
    return new Promise(async (resolve, reject) => {
        if (!skipUuidCheck) {
            const regexResult = validateUuid(inStr);
            if (regexResult == null) {
                reject({httpError: HttpStatus.BAD_REQUEST, chillError: ChillError.INVALID_UUID});
                return;
            }
        }

        const newStatsResult : pg.QueryResult = await pgClient.query('INSERT INTO ChillStats DEFAULT VALUES RETURNING id;');
        const newUserResult : pg.QueryResult = await pgClient.query(`INSERT INTO ChillUser(uuid, stats) VALUES($1, lastval())`, [inStr]);
        

        let chillStats;
        try {
            chillStats = await getChillStats(inStr);
        } catch(e) {
            reject({httpError: HttpStatus.INTERNAL_SERVER_ERROR, chillError: ChillError.INTERNAL_ERROR});
            return;
        }
        resolve(chillStats);
    });
}

export function parseChillError(httpStatusCode: number, chillErr: string | null) {
    const httpError : string = HttpStatus.getStatusText(httpStatusCode);
    return (chillErr == null ? {error: httpError} : {error: httpError, message: chillErr});
}

export const ChillError = Object.freeze({
    "INVALID_UUID": "UUID is not valid",
    "NO_USER": "No user profile found",
    "INTERNAL_ERROR": null
});