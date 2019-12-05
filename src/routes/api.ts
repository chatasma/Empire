import express, { Router } from 'express';
import HttpStatus from 'http-status-codes';
import { getChillStats, parseChillError, createChillStats, ChillError } from '../util/util';

const router : Router = Router();

router.get("/player/:userUuid", async (req : express.Request, res: express.Response) => {
    let chillStats;
    try {
        chillStats = await getChillStats(req.params.userUuid);
    } catch(e) {
        return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
    }
    res.send(chillStats);
});


router.post("/player/:userUuid", async (req : express.Request, res: express.Response) => {
    let chillStats;
    try {
        chillStats = await getChillStats(req.params.userUuid);
        console.log('Already exists, heading OUT early');
    } catch(e) {
        if (e.chillError === ChillError.INVALID_UUID) {
            return res.status(e.httpError).send(parseChillError(e.httpError, e.chillError));
        } else if (e.chillError === ChillError.NO_USER) {
            let chillStatsCreate;
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

export default router;