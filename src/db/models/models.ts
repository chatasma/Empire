// nullable wrapper
export type Nullable<T> = T | null;


/*
 * Artifical Models
 * - if served, assembled by real data from database models
 * - API serves and receives these artificial models
 */

 export interface PrettyChillUser {
     uuid: string;
     wins: {gametype: string, amount: number}[],
     losses: {gametype: string, amount: number}[]
     matches: number[]
 }


/*
 * Database Models
 * - Models as stored in DB
 */

export interface ChillUser {
    uuid: string;
    matches: number[];
}

export interface ChillNumericMetric {
    uuid: string,
    gametype: string,
    metric: string,
    amount: number
}

export interface ChillMatch {
    id?: number
    winners: string[],
    losers: string[],
    gametype: string,
    match_info?: number | MsgoMatchInfo
}

export interface MsgoMatchInfo {
    id?: number,
    top_killer: string
}

// SQL Tables

export const SQLTableStatements = Object.freeze({
    "ChillUser": "ChillUser(uuid CHAR(36) PRIMARY KEY, matches integer[] DEFAULT '{}')",
    "ChillNumericMetric": "ChillNumericMetric(uuid CHAR(36) PRIMARY KEY, gametype VARCHAR(16), metric VARCHAR(16), amount integer)",

    "ChillMatch": "ChillMatch(id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW(), winners CHAR(36)[], losers CHAR(36)[], gametype VARCHAR(16), match_info integer)",
    "MsgoMatchInfo": "MsgoMatchInfo(id SERIAL PRIMARY KEY, top_killer VARCHAR(36))"
});

// Type Guards

export function isChillMatch(obj : any) : boolean {
    if (obj == null) return false;
    return 'winners' in obj && 'losers' in obj && 'gametype' in obj;
}

export function isMsgoMatchInfo(obj : any) : boolean {
    if (obj == null) return false;
    return 'top_killer' in obj && typeof obj.top_killer === 'string';
}