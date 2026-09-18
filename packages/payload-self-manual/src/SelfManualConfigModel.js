import { Model } from '@nan0web/types'

/**
 * Configuration schema and UI constants model for payload-self-manual plugin.
 * Implements Model-as-Schema pattern.
 */
export class SelfManualConfigModel extends Model {
  /**
   * UI Keys and Default Fallback Labels (Model-First i18n)
   */
  static UI = {
    helpButtonAria: 'Contextual Help (Cmd/Ctrl + /)',
    helpButtonTitle: 'Help (⌘/ or Ctrl+/)',
    dialogAria: 'Documentation',
    closeAria: 'Close',
    searchPlaceholder: 'Search docs (⌘/)',
    manualsHeader: 'Manuals ({locale})',
    loading: 'Loading documentation…',
    tabAll: 'All together',
    sourceLabel: 'Source: {source}',
    defaultGuideTitle: 'General Guide',
    dashboardTitle: 'Dashboard & General',
    mediaTitle: 'Media Collection & Storage',
    docNotAvailableTitle: 'Documentation Not Available',
    docNotAvailableMessage: 'No documentation is currently available for **{slug}**.\n\nPlease select another guide from the sidebar.\n\n- Quick shortcut: Press `⌘/` or `Ctrl+/` anytime to toggle help.',
    pluginsTab: 'Ecosystem & Plugins',
    pluginsHeader: 'Active Plugins & Documentation',
    pluginName: 'Plugin',
    pluginVersion: 'Version',
    pluginStatus: 'Status',
    pluginDocs: 'Documentation',
    pluginDocsAvailable: 'Available',
    pluginDocsMissing: 'Not provided',
    systemInfo: 'System Information',
    activeStatus: 'Active',
    viewConfig: 'View Config',
    hideConfig: 'Hide Config',
    viewDocs: 'View Docs',
  }

  /**
   * Documentation root directory.
   */
  static docsDir = {
    type: 'string',
    default: 'docs',
    help: 'Path to documentation directory relative to project root',
    validate: (v) => typeof v === 'string' && v.trim().length > 0 || 'docsDir must be a non-empty string',
  }

  /**
   * Default documentation and interface locale.
   */
  static defaultLocale = {
    type: 'string',
    default: 'uk',
    help: 'Default language code for documentation and fallback',
    validate: (v) => typeof v === 'string' && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(v) || 'defaultLocale must be a valid 2-letter or region locale (e.g. "uk", "en", "en-US")',
  }

  /**
   * Multi-documentation view strategy when multiple sources provide docs for the same slug.
   */
  static multiDocView = {
    type: 'string',
    default: 'tabs',
    enum: ['tabs', 'blocks'],
    help: 'View mode when multiple sources exist: "tabs" or "blocks"',
    validate: (v) => ['tabs', 'blocks'].includes(v) || 'multiDocView must be either "tabs" or "blocks"',
  }

  /**
   * UI elements visibility and layout options.
   */
  static ui = {
    type: 'object',
    default: {
      sidebarMenu: true,
      headerHelpButton: true,
      settingsTab: false,
      multiDocView: 'tabs',
    },
    help: 'UI feature flags and view configuration',
    validate: (v) => typeof v === 'object' && v !== null || 'ui must be an object',
  }

  /**
   * Release notifications and onboarding mode.
   */
  static releaseNotifications = {
    type: 'string',
    default: 'full_tutorial',
    enum: ['full_tutorial', 'badge_only', 'none'],
    help: 'Notification style for new releases: "full_tutorial", "badge_only", or "none"',
    validate: (v) => ['full_tutorial', 'badge_only', 'none'].includes(v) || 'releaseNotifications must be one of: "full_tutorial", "badge_only", "none"',
  }

  /**
   * Custom translation dictionary overrides per locale.
   */
  static translations = {
    type: 'object',
    default: {},
    help: 'Custom i18n translation overrides by locale code',
    validate: (v) => typeof v === 'object' && v !== null || 'translations must be an object',
  }
}


