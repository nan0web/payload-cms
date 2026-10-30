/**
 * Configure payload-mail-tester plugin for Payload CMS.
 *
 * @param {Object} [options]
 * @param {string} [options.group='Settings'] Admin navigation group
 * @param {string} [options.path='/mail-tester'] Admin view path
 * @param {import('./adapter.js').MailAdapterOptions} [options.adapterOptions] Custom options for the mail tester endpoint
 * @returns {(config: any) => any}
 */
export function payloadMailTester(options?: {
    group?: string | undefined;
    path?: string | undefined;
    adapterOptions?: import("./adapter.js").MailAdapterOptions | undefined;
}): (config: any) => any;
export default payloadMailTester;
import { MailTesterConfigModel } from './MailTesterConfigModel.js';
import { payloadMailAdapter } from './adapter.js';
import { resolveTransportConfig } from './adapter.js';
import { createMailTransporter } from './adapter.js';
import { createMailTesterEndpoint } from './endpoint.js';
export { MailTesterConfigModel, payloadMailAdapter, resolveTransportConfig, createMailTransporter, createMailTesterEndpoint };
