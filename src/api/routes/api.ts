import express, { Router } from 'express';
import HttpStatus from 'http-status-codes';
import { getChillStats, parseChillError, createChillStats, ChillError, badRequestWrapper } from '../util/util';
import tokenCheck from '../auth/tokenCheck';
import { isChillMatch, ChillMatch, isMsgoMatchInfo, PrettyChillUser, Nullable } from '../../db/models/models';
import { msgoMatch, matchEnd, getMatch, resolveMatchInfoReferences } from '../../db/match/matchHandler';
import { pgClient } from '../app';

const router : Router = Router();

enum LeaderboardScope {
    GLOBAL = 1,
    GAMEMODE
}

enum GlobalMetric {
    COINS = 1
}

router.get("/top", async (req: express.Request, res: express.Response) => {
    if (!req.query.metric) return res.status(HttpStatus.BAD_REQUEST).send({error: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST), message: "Metric required"});
    const userLimit : number = (req.query.limit && req.query.limit <= 50) ? Math.floor(req.query.limit) : 50;
    const desiredScope : LeaderboardScope = (req.query.gamemode) ? LeaderboardScope.GAMEMODE : LeaderboardScope.GLOBAL;
    if (desiredScope === LeaderboardScope.GLOBAL) {
        const globalMetric : GlobalMetric = (<any>GlobalMetric)[req.query.metric.toUpperCase()];
        if (globalMetric === GlobalMetric.COINS) {
            const matchesQuery = await pgClient.query('SELECT * FROM ChillUser ORDER BY "coins" DESC LIMIT $1', [userLimit]);
            return res.send(matchesQuery.rows);
        }
    } else return res.status(HttpStatus.BAD_REQUEST).send(parseChillError(HttpStatus.BAD_REQUEST, ChillError.GAMEMODE_LEADERBOARD_NOT_SUPPORTED));
    res.status(HttpStatus.BAD_REQUEST).send({error: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST), message: "Invalid metric"});
});

router.get("/player/:userUuid", async (req : express.Request, res: express.Response) => {
    let chillStats : PrettyChillUser;
    try {
        chillStats = await getChillStats(req.params.userUuid);
    } catch(e) {
        return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
    }
    res.send(chillStats);
});


router.post("/player/:userUuid", tokenCheck, async (req : express.Request, res: express.Response) => {
    if (!req.body.username) return badRequestWrapper(res, "Username required");
    let chillStats : PrettyChillUser;
    try {
        chillStats = await getChillStats(req.params.userUuid);
    } catch(e) {
        if (e.chillError === ChillError.INVALID_UUID) {
            return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
        } else if (e.chillError === ChillError.NO_USER) {
            let chillStatsCreate : PrettyChillUser;
            try {
                chillStatsCreate = await createChillStats(req.params.userUuid, req.body.username, true);
            } catch(e) {
                return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
            }
            chillStats = await getChillStats(req.params.userUuid);
        } else {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({error: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR)});
        }
    }
    res.send(chillStats);
});

router.get("/match/:matchId", async (req : express.Request, res : express.Response) => {
    let parsedParam : number;
    try {
        parsedParam = parseInt(req.params.matchId);
    } catch (e) {
        return res.status(HttpStatus.BAD_REQUEST).send({error: HttpStatus.BAD_REQUEST, message: "Could not parse Match ID as integer"});
    }
    
    try {
        const obtainedMatch : ChillMatch = await getMatch(parsedParam);
        res.send(obtainedMatch);
    } catch(e) {
        return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
    }
});

router.get("/matches", async (req: express.Request, res: express.Response) => {
    const matchLimit : number = req.query.limit && req.query.limit <= 50 ? Math.floor(req.query.limit) : 50;
    const matchesQuery = await pgClient.query('SELECT * FROM ChillMatch ORDER BY "created_at" DESC LIMIT $1', [matchLimit]);
    if (matchesQuery.rowCount === 0) return res.send(matchesQuery.rows);
    const parsedMatches : ChillMatch[] = [];
    for (const rawMatch of matchesQuery.rows) {
        parsedMatches.push(await resolveMatchInfoReferences(<ChillMatch> rawMatch));
    }
    res.send(parsedMatches);
});

router.post("/match", tokenCheck, async (req : express.Request, res: express.Response) => {
    if (!isChillMatch(req.body)) {
        return res.status(HttpStatus.BAD_REQUEST).send({error: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)});
    }

    const castedMatch : ChillMatch = <ChillMatch> req.body;
    if (castedMatch.match_info) {
        let matchObject : Nullable<ChillMatch> = null;
        if (castedMatch.gametype.toLowerCase() === 'msgo') {
            if (!isMsgoMatchInfo(castedMatch.match_info)) return invalidGametypeMatchInfo(res, "MSGO");
            matchObject = await msgoMatch(castedMatch);
        }
        
        if (matchObject == null) 
            return res.status(HttpStatus.BAD_REQUEST).send(parseChillError(HttpStatus.BAD_REQUEST, ChillError.INVALID_GAMETYPE));
        return res.send(matchObject);
    } else {
        const matchObject = await matchEnd(castedMatch, -1);
        return res.send(matchObject);
    }
});

function invalidGametypeMatchInfo(res : express.Response, gametype : string) {
    return res.status(HttpStatus.BAD_REQUEST).send({
        error: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST),
        message: `Invalid match info for gametype ${gametype}`
    });
}


export default router;