/** Export backend files and metadata through an async record stream. */
export function exportFiles({ source, destination, records, dryRun }: {
    source: any;
    destination: any;
    records: any;
    dryRun?: boolean | undefined;
}): AsyncGenerator<any, void, unknown>;
