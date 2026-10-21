/**
 * Configuration schema for @nan0web/payload-release plugin.
 * Implements Model-as-Schema pattern.
 */
export class ReleaseConfigModel extends Model {
    /**
     * Path to releases directory relative to project root.
     */
    static releasesDir: {
        type: string;
        default: string;
        help: string;
        validate: (v: any) => true | "releasesDir must be a non-empty string";
    };
    /**
     * Whether Markdown file preview is enabled in Admin UI.
     */
    static allowPreview: {
        type: string;
        default: boolean;
        help: string;
    };
    /**
     * UI labels and translation tokens.
     */
    static UI: {
        singular: string;
        plural: string;
        group: string;
        tabGeneral: string;
        tabSteps: string;
        tabParity: string;
        tabIssues: string;
        tabFiles: string;
        tabTour: string;
        previewButton: string;
        modalClose: string;
        launchTourButton: string;
        loading: string;
        errorNotFound: string;
    };
    /**
     * @param {Partial<ReleaseConfigModel>} [data]
     * @param {import('@nan0web/types').ModelOptions} [options]
     */
    constructor(data?: Partial<ReleaseConfigModel>, options?: import("@nan0web/types").ModelOptions);
    /** @type {string} */ releasesDir: string;
    /** @type {boolean} */ allowPreview: boolean;
}
import { Model } from '@nan0web/types';
