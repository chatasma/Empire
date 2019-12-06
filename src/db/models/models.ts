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
    return 'uuid' in obj && 'stats' in obj;
}

export interface ChillStats {
    id: number,
    wins: number[] | ChillGamemodeMetric[]
}

export interface ChillGamemodeMetric {
    id: number,
    gametype: string,
    amount: number
}

export const SQLTableStatements = Object.freeze({
    "ChillUser": "ChillUser(uuid CHAR(36) PRIMARY KEY, stats integer REFERENCES ChillStats)",
    "ChillStats": "ChillStats(id SERIAL PRIMARY KEY, wins integer REFERENCES ChillGamemodeMetric)",
    "ChillGamemodeMetric": "ChillGamemodeMetric(id SERIAL PRIMARY KEY, gametype VARCHAR(16), amount integer)"
});