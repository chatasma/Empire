export function generateDynamicParams(amount: number) : string {
    if (amount === 1) return `$1`;
    const arr : string[] = [];
    for (let x = 0; x < amount; x++) {
        arr.push(`$${x + 1}`);
    }
    return arr.join(', ');
}

export function generateDynamicParamsOffset(amount: number, start : number) : string {
    if (amount === 1) return `$${start}`;
    const arr : string[] = [];
    for (let x = start - 1; x < amount; x++) {
        arr.push(`$${x + 1}`);
    }
    return arr.join(', ');
}