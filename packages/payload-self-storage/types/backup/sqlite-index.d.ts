/**
 * Create the SQLite index contract. The caller supplies a SQLite driver so the
 * package remains free of native/provider dependencies.
 */
export function createBackupIndex({ filename, database }: {
    filename: any;
    database: any;
}): Promise<{
    add(record: any): Promise<void>;
}>;
