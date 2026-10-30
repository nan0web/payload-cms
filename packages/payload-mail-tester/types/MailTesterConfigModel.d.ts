/**
 * Configuration schema and UI constants model for payload-mail-tester plugin.
 * Implements Model-as-Schema pattern.
 */
export class MailTesterConfigModel extends Model {
    /**
     * UI Keys and Default Fallback Labels (Model-First i18n)
     */
    static UI: {
        navLabel: string;
        navGroup: string;
        pageTitle: string;
        pageDescription: string;
        statusTitle: string;
        statusChecking: string;
        statusReady: string;
        statusError: string;
        statusMock: string;
        transportLabel: string;
        recipientLabel: string;
        recipientPlaceholder: string;
        sendTestBtn: string;
        sending: string;
        refreshStatus: string;
        sendSuccess: string;
        sendFailed: string;
        serverLogsTitle: string;
        fromAddress: string;
        noLogs: string;
    };
    /**
     * Transport mode: 'sendmail', 'smtp', or 'mock'.
     */
    static transport: {
        type: string;
        default: string;
        enum: string[];
        help: string;
    };
    /**
     * Default sender address.
     */
    static defaultFromAddress: {
        type: string;
        default: string;
        help: string;
    };
    /**
     * Default sender display name.
     */
    static defaultFromName: {
        type: string;
        default: string;
        help: string;
    };
}
import { Model } from '@nan0web/types';
