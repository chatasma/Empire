/*
 * Database Models
 */

// nullable wrapper
export type Nullable<T> = T | null;

export interface ChillUser {
    uuid: string,
    stats?: number | ChillStats
}

export function isChillUser(obj : any) {
    if (obj == null) return false;
    return 'uuid' in obj && 'stats' in obj;
}

export interface ChillStats {
    id: number,
    wins: number[] | ChillGamemodeMetric[]
}

export function isChillStats(obj : any) {
    if (obj == null) return false;
    return 'id' in obj && 'wins' in obj;
}

export interface ChillGamemodeMetric {
    id: number,
    gametype: string,
    amount: number
}

export const SQLTableStatements = Object.freeze({
    "ChillUser": "ChillUser(uuid CHAR(36) PRIMARY KEY, stats integer)",
    "ChillStats": "ChillStats(id SERIAL PRIMARY KEY, wins integer[] DEFAULT '{}')",
    "ChillGamemodeMetric": "ChillGamemodeMetric(id SERIAL PRIMARY KEY, gametype VARCHAR(16), amount integer)"
});