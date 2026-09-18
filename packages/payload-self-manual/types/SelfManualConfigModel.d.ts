/**
 * Configuration schema and UI constants model for payload-self-manual plugin.
 * Implements Model-as-Schema pattern.
 */
export class SelfManualConfigModel extends Model {
    /**
     * UI Keys and Default Fallback Labels (Model-First i18n)
     */
    static UI: {
        helpButtonAria: string;
        helpButtonTitle: string;
        dialogAria: string;
        closeAria: string;
        searchPlaceholder: string;
        manualsHeader: string;
        loading: string;
        tabAll: string;
        sourceLabel: string;
        defaultGuideTitle: string;
        dashboardTitle: string;
        mediaTitle: string;
        docNotAvailableTitle: string;
        docNotAvailableMessage: string;
        pluginsTab: string;
        pluginsHeader: string;
        pluginName: string;
        pluginVersion: string;
        pluginStatus: string;
        pluginDocs: string;
        pluginDocsAvailable: string;
        pluginDocsMissing: string;
        systemInfo: string;
        activeStatus: string;
        viewConfig: string;
        hideConfig: string;
        viewDocs: string;
    };
    /**
     * Documentation root directory.
     */
    static docsDir: {
        type: string;
        default: string;
        help: string;
        validate: (v: any) => true | "docsDir must be a non-empty string";
    };
    /**
     * Default documentation and interface locale.
     */
    static defaultLocale: {
        type: string;
        default: string;
        help: string;
        validate: (v: any) => true | "defaultLocale must be a valid 2-letter or region locale (e.g. \"uk\", \"en\", \"en-US\")";
    };
    /**
     * Multi-documentation view strategy when multiple sources provide docs for the same slug.
     */
    static multiDocView: {
        type: string;
        default: string;
        enum: string[];
        help: string;
        validate: (v: any) => true | "multiDocView must be either \"tabs\" or \"blocks\"";
    };
    /**
     * UI elements visibility and layout options.
     */
    static ui: {
        type: string;
        default: {
            sidebarMenu: boolean;
            headerHelpButton: boolean;
            settingsTab: boolean;
            multiDocView: string;
        };
        help: string;
        validate: (v: any) => true | "ui must be an object";
    };
    /**
     * Release notifications and onboarding mode.
     */
    static releaseNotifications: {
        type: string;
        default: string;
        enum: string[];
        help: string;
        validate: (v: any) => true | "releaseNotifications must be one of: \"full_tutorial\", \"badge_only\", \"none\"";
    };
    /**
     * Custom translation dictionary overrides per locale.
     */
    static translations: {
        type: string;
        default: {};
        help: string;
        validate: (v: any) => true | "translations must be an object";
    };
}
import { Model } from '@nan0web/types';
