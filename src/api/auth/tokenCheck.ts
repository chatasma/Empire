import express from 'express';
import config from '../../config';
import HttpStatus from 'http-status-codes';

export default function(req : express.Request, res : express.Response, next : express.NextFunction) {
    if (!req.headers.authorization || req.headers.authorization !== config.api.api_token)
        return res.status(HttpStatus.UNAUTHORIZED).send({error: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED)});
    next();
} 