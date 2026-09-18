/**
 * SelfManual Help Modal & Action Component for Payload CMS Admin.
 *
 * @param {Object} props
 * @param {string} [props.docsDir='docs']
 * @param {string} [props.defaultLocale='uk']
 * @param {string[]} [props.availableLocales=[]]
 * @param {Object} [props.ui={}]
 * @param {Record<string, Record<string, string>>} [props.translations={}]
 * @returns {React.JSX.Element}
 */
export function SelfManualHelp({ docsDir, defaultLocale, availableLocales, ui, translations, }: {
    docsDir?: string | undefined;
    defaultLocale?: string | undefined;
    availableLocales?: string[] | undefined;
    ui?: any;
    translations?: Record<string, Record<string, string>> | undefined;
}): React.JSX.Element;
export default SelfManualHelp;
import React from 'react';
