/**
 * Diagnostic endpoint handler for checking mail connection status and sending test messages.
 *
 * @param {Object} [options]
 * @param {import('./adapter.js').MailAdapterOptions} [options.adapterOptions]
 * @returns {(req: any) => Promise<Response>}
 */
export function createMailTesterEndpoint(options?: {
    adapterOptions?: import("./adapter.js").MailAdapterOptions | undefined;
}): (req: any) => Promise<Response>;
