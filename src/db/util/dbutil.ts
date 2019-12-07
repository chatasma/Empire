export function generateDynamicParams(amount: number) : string {
    const arr : string[] = [];
    for (let x = 0; x < amount; x++) {
        arr.push(`$${x + 1}`);
    }
    return arr.join(', ');
}

export function generateDynamicParamsOffset(amount: number, start : number) : string {
    const arr : string[] = [];
    for (let x = start - 1; x < amount; x++) {
        arr.push(`$${x + 1}`);
    }
    return arr.join(', ');
}