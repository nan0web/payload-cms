export function afterReadHook({ publicUrlPrefix }: {
    publicUrlPrefix: any;
}): ({ doc, req }: {
    doc: any;
    req: any;
}) => Promise<any>;
export function beforeChangeHook({ backend, publicUrlPrefix, rootDir, convertToWebp }: {
    backend: any;
    publicUrlPrefix: any;
    rootDir: any;
    convertToWebp: any;
}): ({ doc, req }: {
    doc: any;
    req: any;
}) => Promise<any>;
export function afterDeleteHook({ backend }: {
    backend: any;
}): ({ doc }: {
    doc: any;
}) => Promise<void>;
/**
 * @param {{ backend: any, publicUrlPrefix?: string, rootDir: string, convertToWebp?: boolean, onRedirect?: (redirect: any) => Promise<void> | void }} options
 */
export function afterChangeHook({ backend, publicUrlPrefix, rootDir, convertToWebp, onRedirect }: {
    backend: any;
    publicUrlPrefix?: string;
    rootDir: string;
    convertToWebp?: boolean;
    onRedirect?: (redirect: any) => Promise<void> | void;
}): ({ doc, previousDoc, req }: {
    doc: any;
    previousDoc: any;
    req: any;
}) => Promise<any>;
