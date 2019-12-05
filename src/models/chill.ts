export interface ChillUser {
    uuid: string,
    stats?: ChillStats
}

export interface ChillStats {
    uuid: string,
    msgo_wins?: number
}

export function addUuidReference(json: object, uuid: string) {
    return {uuid: uuid, ...json};
}