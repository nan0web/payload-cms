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
/**
 * @param {{ lookup: (url: string) => Promise<any>, authorize?: (to: string, context?: any) => Promise<boolean> | boolean }} options
 */
export function createRedirectResolver({ lookup, authorize }: {
    lookup: (url: string) => Promise<any>;
    authorize?: (to: string, context?: any) => Promise<boolean> | boolean;
}): (url: any, context: any) => Promise<any>;
