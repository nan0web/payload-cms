/**
 * Lightweight native parser for tour.nan0 YAML/Key-Value structure.
 * Zero external dependencies.
 *
 * @param {string} raw
 * @returns {TourManifestModel}
 */
export function parseTourNan0(raw: string): TourManifestModel;
/**
 * Overlays localized titles and contents on top of base tour steps.
 *
 * @param {TourManifestModel} baseTour
 * @param {TourManifestModel|null} localizedTour
 * @returns {TourManifestModel}
 */
export function mergeTourWithLocale(baseTour: TourManifestModel, localizedTour: TourManifestModel | null): TourManifestModel;
/**
 * Validates individual step within a product tour.
 */
export class TourStepModel extends Model {
    static step: {
        type: string;
        required: boolean;
        validate: (v: any) => true | "step must be a positive integer";
    };
    static route: {
        type: string;
        required: boolean;
        validate: (v: any) => true | "route must start with /";
    };
    static target: {
        type: string;
        required: boolean;
        validate: (v: any) => true | "target CSS selector required";
    };
    static title: {
        type: string;
        required: boolean;
    };
    static content: {
        type: string;
        required: boolean;
    };
    static position: {
        type: string;
        default: string;
        validate: (v: any) => true | "invalid position";
    };
    static action: {
        type: string;
        default: string;
        validate: (v: any) => true | "invalid action";
    };
    static value: {
        type: string;
    };
    static waitFor: {
        type: string;
    };
    /**
     * @param {Partial<TourStepModel>} [data]
     * @param {import('@nan0web/types').ModelOptions} [options]
     */
    constructor(data?: Partial<TourStepModel>, options?: import("@nan0web/types").ModelOptions);
    /** @type {number} */ step: number;
    /** @type {string} */ route: string;
    /** @type {string} */ target: string;
    /** @type {string} */ title: string;
    /** @type {string} */ content: string;
    /** @type {string} */ position: string;
    /** @type {string} */ action: string;
    /** @type {string} */ value: string;
    /** @type {string} */ waitFor: string;
}
/**
 * Validates complete tour manifest for a release.
 */
export class TourManifestModel extends Model {
    static version: {
        type: string;
        required: boolean;
    };
    static title: {
        type: string;
        required: boolean;
    };
    static steps: {
        type: string;
        model: typeof TourStepModel;
        required: boolean;
    };
    /**
     * @param {Partial<TourManifestModel>} [data]
     * @param {import('@nan0web/types').ModelOptions} [options]
     */
    constructor(data?: Partial<TourManifestModel>, options?: import("@nan0web/types").ModelOptions);
    /** @type {string} */ version: string;
    /** @type {string} */ title: string;
    /** @type {Array<TourStepModel>} */ steps: Array<TourStepModel>;
}
import { Model } from '@nan0web/types';
