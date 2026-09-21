/**
 * Sidebar Navigation Component for SelfManual Modal
 *
 * @param {Object} props
 * @param {string} props.searchQuery
 * @param {Function} props.onSearchChange
 * @param {Array<any>} props.filteredDocuments
 * @param {string} props.activeSlug
 * @param {string} props.currentPathSlug
 * @param {string} props.currentLocale
 * @param {Function} props.onSelectSlug
 * @param {Function} props.t
 * @param {Object} props.UI
 * @returns {React.JSX.Element}
 */
export function SidebarNav({ searchQuery, onSearchChange, filteredDocuments, activeSlug, currentPathSlug, currentLocale, onSelectSlug, t, UI, }: {
    searchQuery: string;
    onSearchChange: Function;
    filteredDocuments: Array<any>;
    activeSlug: string;
    currentPathSlug: string;
    currentLocale: string;
    onSelectSlug: Function;
    t: Function;
    UI: any;
}): React.JSX.Element;
import React from 'react';
