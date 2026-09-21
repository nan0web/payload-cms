/**
 * Documentation Article View Component
 *
 * @param {Object} props
 * @param {any} props.activeDocument
 * @param {string} props.activeTab
 * @param {Function} props.onSelectTab
 * @param {string} props.multiDocView
 * @param {Function} props.t
 * @param {Object} props.UI
 * @returns {React.JSX.Element}
 */
export function DocArticleView({ activeDocument, activeTab, onSelectTab, multiDocView, t, UI, }: {
    activeDocument: any;
    activeTab: string;
    onSelectTab: Function;
    multiDocView: string;
    t: Function;
    UI: any;
}): React.JSX.Element;
import React from 'react';
