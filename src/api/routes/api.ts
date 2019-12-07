import express, { Router } from 'express';
import HttpStatus from 'http-status-codes';
import { getChillStats, parseChillError, createChillStats, ChillError } from '../util/util';
import tokenCheck from '../auth/tokenCheck';
import { isChillMatch, ChillMatch, isMsgoMatchInfo, PrettyChillUser, Nullable } from '../../db/models/models';
import { msgoMatch, matchEnd } from '../../db/match/matchHandler';

const router : Router = Router();

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
    let chillStats : PrettyChillUser;
    try {
        chillStats = await getChillStats(req.params.userUuid);
    } catch(e) {
        if (e.chillError === ChillError.INVALID_UUID) {
            return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
        } else if (e.chillError === ChillError.NO_USER) {
            let chillStatsCreate : PrettyChillUser;
            try {
                chillStatsCreate = await createChillStats(req.params.userUuid, true);
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