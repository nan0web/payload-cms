/** Restore records one at a time without loading the full index in memory. */
export function restoreFiles({ source, destination, records, verify, dryRun }: {
    source: any;
    destination: any;
    records: any;
    verify?: boolean | undefined;
    dryRun?: boolean | undefined;
}): Promise<{
    restored: number;
    missing: never[];
    changed: never[];
    orphan: never[];
}>;
