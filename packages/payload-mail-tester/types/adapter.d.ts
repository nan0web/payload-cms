/**
 * @typedef {Object} SmtpOptions
 * @property {string} [host]
 * @property {number} [port]
 * @property {boolean} [secure]
 * @property {{ user?: string, pass?: string }} [auth]
 * @property {boolean} [tlsRejectUnauthorized]
 */
/**
 * @typedef {Object} MailAdapterOptions
 * @property {'auto' | 'sendmail' | 'smtp' | 'mock'} [transport='auto']
 * @property {string} [sendmailPath]
 * @property {SmtpOptions} [smtp]
 * @property {string} [defaultFromAddress]
 * @property {string} [defaultFromName]
 * @property {any} [transporter] Custom nodemailer transporter instance
 * @property {(text: string) => void} [logger]
 */
/**
 * Resolves the active mail transport configuration.
 *
 * @param {MailAdapterOptions} [options={}]
 * @returns {{
 *   type: 'sendmail' | 'smtp' | 'mock',
 *   transportOptions: Record<string, any>,
 *   isMock: boolean,
 *   sendmailPath?: string
 * }}
 */
export function resolveTransportConfig(options?: MailAdapterOptions): {
    type: "sendmail" | "smtp" | "mock";
    transportOptions: Record<string, any>;
    isMock: boolean;
    sendmailPath?: string;
};
/**
 * Creates a configured Nodemailer transporter or wraps custom one.
 *
 * @param {MailAdapterOptions} [options={}]
 * @returns {{
 *   transporter: import('nodemailer').Transporter,
 *   type: 'sendmail' | 'smtp' | 'mock',
 *   isMock: boolean,
 *   sendmailPath?: string
 * }}
 */
export function createMailTransporter(options?: MailAdapterOptions): {
    transporter: any;
    type: "sendmail" | "smtp" | "mock";
    isMock: boolean;
    sendmailPath?: string;
};
/**
 * Universal Payload 3.x email adapter generator.
 * Compatible with `email: payloadMailAdapter(options)` in payload.config.ts.
 *
 * @param {MailAdapterOptions} [options={}]
 * @returns {({ payload }: { payload: any }) => {
 *   name: string,
 *   defaultFromAddress: string,
 *   defaultFromName: string,
 *   sendEmail: (message: any) => Promise<any>
 * }}
 */
export function payloadMailAdapter(options?: MailAdapterOptions): ({ payload }: {
    payload: any;
}) => {
    name: string;
    defaultFromAddress: string;
    defaultFromName: string;
    sendEmail: (message: any) => Promise<any>;
};
export type SmtpOptions = {
    host?: string | undefined;
    port?: number | undefined;
    secure?: boolean | undefined;
    auth?: {
        user?: string;
        pass?: string;
    } | undefined;
    tlsRejectUnauthorized?: boolean | undefined;
};
export type MailAdapterOptions = {
    transport?: "auto" | "sendmail" | "smtp" | "mock" | undefined;
    sendmailPath?: string | undefined;
    smtp?: SmtpOptions | undefined;
    defaultFromAddress?: string | undefined;
    defaultFromName?: string | undefined;
    /**
     * Custom nodemailer transporter instance
     */
    transporter?: any;
    logger?: ((text: string) => void) | undefined;
};
