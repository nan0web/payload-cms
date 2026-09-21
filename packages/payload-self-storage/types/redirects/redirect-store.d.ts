/** Create a backend-neutral redirect record. */
export function createRedirect({ from, to, statusCode, expiresAt, resourceType }: {
    from: any;
    to: any;
    statusCode?: number | undefined;
    expiresAt?: null | undefined;
    resourceType?: string | undefined;
}): {
    from: any;
    to: any;
    statusCode: number;
    expiresAt: null;
    resourceType: string;
    createdAt: Date;
    updatedAt: Date;
};
export function createRedirectResolver({ lookup, authorize }: {
    lookup: any;
    authorize?: (() => Promise<boolean>) | undefined;
}): (url: any, context: any) => Promise<any>;
