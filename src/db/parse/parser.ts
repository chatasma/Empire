import { Nullable, MsgoMatchInfo } from "../models/models";
import { pgClient } from "../../api/app";

/*
 * Parser will evaluate all references of a model.
 */

export function parseMsgoMatchInfoReference(ref : number) : Promise<Nullable<MsgoMatchInfo>> {
    return new Promise(async (resolve, reject) => {
        const msgoMatchInfo = await pgClient.query(`SELECT * FROM MsgoMatchInfo WHERE id = $1`, [ref]);
        resolve((msgoMatchInfo.rowCount === 0) ? null : msgoMatchInfo.rows[0]);
    });
}