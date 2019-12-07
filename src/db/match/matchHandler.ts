import { ChillMatch, Nullable, MsgoMatchInfo } from "../models/models";
import { parseMsgoMatchInfoReference } from "../parse/parser";
import { pgClient } from "../../api/app";
import pg from 'pg';
import { generateDynamicParams, generateDynamicParamsOffset } from "../util/dbutil";

// Precondition : gametype is 'msgo' & match_info is MsgoMatchInfo and non-null
export function msgoMatch(match : ChillMatch) : Promise<ChillMatch> {
    return new Promise(async (resolve, reject) => {
        if (typeof match.match_info === 'number') {
            const parsedMsgoMatchInfo : Nullable<MsgoMatchInfo> = await parseMsgoMatchInfoReference(match.match_info);
            if (parsedMsgoMatchInfo == null) return;
            const parsedMatchInfo : MsgoMatchInfo = <MsgoMatchInfo> parsedMsgoMatchInfo;
            await pgClient.query('INSERT INTO MsgoMatchInfo(top_killer) VALUES($1) RETURNING id', [parsedMatchInfo.top_killer]);
        }
        const lastValQuery = await pgClient.query('SELECT lastval()');
        console.log(`last val query ${lastValQuery}`);
        resolve(await matchEnd(match, lastValQuery.rows[0]));
    })
}

export function matchEnd(match : ChillMatch, matchinfo : number) : Promise<ChillMatch> {
    return new Promise(async (resolve, reject) => {
        await addWins(match.winners, match.gametype);
        const paramArray : any[] = [];
        match.winners.forEach((winner) => paramArray.push(winner));
        match.losers.forEach((loser) => paramArray.push(loser));
        paramArray.push(match.gametype);
        paramArray.push(matchinfo);
        if (matchinfo < 0) 
            await pgClient.query(`INSERT INTO ChillMatch(winners, losers, gametype) VALUES('{${generateDynamicParams(match.winners.length)}}', '{${generateDynamicParamsOffset(match.losers.length, match.winners.length + 1)}}', $${match.winners.length + match.losers.length + 1})) RETURNING id`, paramArray);
        else {
            paramArray.push(matchinfo);
            await pgClient.query(`INSERT INTO ChillMatch(winners, losers, gametype, match_info) VALUES('{${generateDynamicParams(match.winners.length)}}', '{${generateDynamicParamsOffset(match.losers.length, match.winners.length + 1)}}', $${match.winners.length + match.losers.length + 1}), $${match.winners.length + match.losers.length + 2}) RETURNING id`, paramArray);
        }
        
        const matchIDContainer : pg.QueryResult = await pgClient.query(`SELECT lastval()`);
        const matchInteger = matchIDContainer.rows[0];
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