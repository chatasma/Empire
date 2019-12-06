import { ChillUser, ChillStats, ChillGamemodeMetric, Nullable, isChillUser } from "../models/models";
import { pgClient } from "../../api/app";
import { generateDynamicParams } from '../util/dbutil';


/*
 * Parser will evaluate all references of a model.
 */

export function parseChillUser(obj : ChillUser) : Promise<ChillUser> {
    return new Promise(async (resolve, reject) => {
        if (typeof obj.stats === "number") {
            const chillStats : Nullable<ChillStats> = await parseChillStatsReference(obj.stats);
            if (isChillUser(chillStats)) {
                const castedChillStats = <ChillStats> chillStats;
                obj.stats = castedChillStats;
            }
        }
        resolve(obj);
    });
}

export function parseChillStatsReference(ref : number) : Promise<Nullable<ChillStats>> {
    return new Promise(async (resolve, reject) => {
        const chillStatsResult = await pgClient.query(`SELECT * FROM ChillStats WHERE id = ${ref}`);
        const preCastedResult : Nullable<ChillStats> = <Nullable<ChillStats>> chillStatsResult.rows[0];
        if (!isChillUser(preCastedResult)) {
            resolve(null);
            return;
        }
        const castedResult : ChillStats = <ChillStats> preCastedResult;
        if (castedResult.wins instanceof Array && typeof castedResult.wins[0] === "number") {
            const castedWins : number[] = <number[]> castedResult.wins;
            const chillWinsMetricResult : Nullable<ChillGamemodeMetric[]> = await parseChillMetricReferences(castedWins);
            if (chillWinsMetricResult == null) {
                castedResult.wins = [];
            } else {
                castedResult.wins = <ChillGamemodeMetric[]> chillWinsMetricResult;
            }
        }
        resolve(castedResult);
    })
}

export function parseChillMetricReferences(ref : number[]) : Promise<Nullable<ChillGamemodeMetric[]>> {
    return new Promise(async (resolve, reject) => {
        const chillMetric = await pgClient.query(`SELECT * FROM ChillGamemodeMetric WHERE id IN (${generateDynamicParams(ref.length)})`, ref);
        resolve((chillMetric.rowCount === 0) ? null : chillMetric.rows);
    });
}

export function parseChillMetricReference(ref : number) : Promise<Nullable<ChillGamemodeMetric>> {
    return new Promise(async (resolve, reject) => {
        const chillMetric = await pgClient.query(`SELECT * FROM ChillGamemodeMetric WHERE id = ${ref}`);
        resolve((chillMetric.rowCount === 0) ? null : chillMetric.rows[0]);
    });
}