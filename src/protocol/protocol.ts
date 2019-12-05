import fetch, { Response } from 'node-fetch';
import config from '../config'
import HttpStatus from 'http-status-codes';

const API_BASE = config.api.api_base;

function parseRawProtocolRequest(protocolId : number, parameters : string[]) : Promise<{content: string, statusCode: number}> {
    return new Promise(async (resolve, reject) => {
        let callbackFn : Function;
        switch (protocolId) {
            case 1:
                callbackFn = getChillUser;
                break;
            case 2:
                callbackFn = createChillUser;
                break;
            default:
                callbackFn = () => {
                    return {error: "Invalid Protocol ID"};
                };
        }

        let callbackResult;
        try {
            callbackResult = await callbackFn(parameters);
        } catch(e) {
            reject({content: e.content, statusCode: e.statusCode});
        }
        resolve(callbackResult);
    });
}




/*
 * Protocol
 */

function createChillUser(parameters: string[]) {
    return new Promise(async (resolve, reject) => {
        let fetchResponse : Response;
        let fetchResult;
        try {
            fetchResponse = await fetch(API_BASE + '/api/player/' + parameters[0], {
                method: 'POST',
                headers: {
                    Authorization: config.api.api_token
                }
            });
            fetchResult = await fetchResponse.json();
        } catch (e) {
            reject({content: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR), statusCode: HttpStatus.INTERNAL_SERVER_ERROR});
            return;
        }

        if (fetchResponse.status !== HttpStatus.OK) {
            const contentMessage = fetchResult && fetchResult.message ? fetchResult.message : HttpStatus.getStatusText(fetchResponse.status);
            reject({content: contentMessage, statusCode: fetchResponse.status});
            return;
        }

        resolve({content: fetchResult, statusCode: HttpStatus.OK});
    });
}


function getChillUser(parameters : string[]) {
    return new Promise(async (resolve, reject) => {
        let fetchResponse : Response;
        let fetchResult;
        try {
            fetchResponse = await fetch(API_BASE + '/api/player/' + parameters[0]);
            fetchResult = await fetchResponse.json();
        } catch (e) {
            reject({content: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR), statusCode: HttpStatus.INTERNAL_SERVER_ERROR});
            return;
        }

        if (fetchResponse.status !== HttpStatus.OK) {
            const contentMessage = fetchResult && fetchResult.message ? fetchResult.message : HttpStatus.getStatusText(fetchResponse.status);
            reject({content: contentMessage, statusCode: fetchResponse.status});
            return;
        }

        resolve({content: fetchResult, statusCode: HttpStatus.OK});
    });
}



export { parseRawProtocolRequest as protocolRequest };