/**
 * Restore records one at a time without loading the full index in memory.
 * @param {{ source: any, destination: any, records: AsyncIterable<any> | Iterable<any>, verify?: boolean, dryRun?: boolean }} options
 */
export function restoreFiles({ source, destination, records, verify, dryRun }: {
    source: any;
    destination: any;
    records: AsyncIterable<any> | Iterable<any>;
    verify?: boolean;
    dryRun?: boolean;
}): Promise<{
    restored: number;
    missing: string[];
    changed: Array<{
        storageKey: string;
        expected: string;
        actual: string;
    }>;
    orphan: string[];
}>;
