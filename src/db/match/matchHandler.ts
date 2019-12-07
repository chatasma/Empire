import { ChillMatch, Nullable, MsgoMatchInfo } from "../models/models";
import { parseMsgoMatchInfoReference } from "../parse/parser";
import { pgClient } from "../../api/app";
import pg from 'pg';
import { generateDynamicParams, generateDynamicParamsOffset } from "../util/dbutil";

// Precondition : gametype is 'msgo' & match_info is MsgoMatchInfo and non-null
export function msgoMatch(match : ChillMatch) : Promise<ChillMatch> {
    return new Promise(async (resolve, reject) => {
        const matchInfo : MsgoMatchInfo = <MsgoMatchInfo> match.match_info;
        await pgClient.query('INSERT INTO MsgoMatchInfo(top_killer) VALUES($1) RETURNING id', [matchInfo.top_killer]);
        const lastValQuery = await pgClient.query('SELECT lastval()');
        resolve(await matchEnd(match, lastValQuery.rows[0].lastval));
    })
}

export function matchEnd(match : ChillMatch, matchinfo : number) : Promise<ChillMatch> {
    return new Promise(async (resolve, reject) => {
        await addWins(match.winners, match.gametype);
        const paramArray : any[] = [];
        paramArray.push(match.winners);
        paramArray.push(match.losers);
        paramArray.push(match.gametype);
        if (matchinfo < 0) 
            await pgClient.query(`INSERT INTO ChillMatch(winners, losers, gametype) VALUES($1, $2, $3) RETURNING id`, paramArray);
        else {
            paramArray.push(matchinfo);
            await pgClient.query(`INSERT INTO ChillMatch(winners, losers, gametype, match_info) VALUES($1, $2, $3, $4) RETURNING id`, paramArray);
        }
        const matchIDContainer : pg.QueryResult = await pgClient.query(`SELECT lastval()`);
        const matchInteger : number = matchIDContainer.rows[0].lastval;
        const matchObject : pg.QueryResult = await pgClient.query('SELECT * FROM ChillMatch WHERE id = $1', [matchInteger]);
        resolve(<ChillMatch> matchObject.rows[0]);
    });
}

export function addWins(uuids : string[], gametype : string) : Promise<void> {
    return new Promise(async (resolve, reject) => {
        const paramArray : any[] = [];
        uuids.forEach((val) => paramArray.push(val));
        paramArray.push(gametype);
        await pgClient.query(`UPDATE ChillNumericMetric SET amount = amount + 1 WHERE uuid IN (${generateDynamicParams(uuids.length)}) AND gametype = $${uuids.length + 1} AND metric = 'wins'`, paramArray);
        resolve();
    });
}