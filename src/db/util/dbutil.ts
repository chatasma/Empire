export function generateDynamicParams(amount: number) : string {
    const arr : string[] = [];
    for (let x = 0; x < amount; x++) {
        arr.push(`$${x + 1}`);
    }
    return arr.join(', ');
}