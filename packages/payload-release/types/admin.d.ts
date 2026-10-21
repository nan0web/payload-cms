/**
 * File Preview Button & Modal Viewer for Release Files (task.md, user.md, etc.)
 *
 * @param {Object} props
 * @param {any} [props.value]
 * @param {any} [props.path]
 * @returns {React.JSX.Element}
 */
export function FilePreviewButton(props: {
    value?: any;
    path?: any;
}): React.JSX.Element;
/**
 * Compact clean list view for Release Steps with expandable detailed output
 */
export function ReleaseStepsField(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * Compact clean list view for Release Files
 */
export function ReleaseFilesField(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * Compact clean list view for Release Parity
 */
export function ReleaseParityField(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * Compact clean list view for Release Issues
 */
export function ReleaseIssuesField(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * Custom full Document View for Releases:
 * - Syncs active tab with URL hash (#general, #steps, #parity, #issues, #files)
 * - Directly supports deep-linking via URL hash for sharing with colleagues
 * - Displays clean read-only summary for General tab without any form inputs
 * - Embeds compact list views for Steps, Parity, Issues, and Files
 */
export function ReleaseDocumentView(props: any): import("react/jsx-runtime").JSX.Element;
export default FilePreviewButton;
import React from 'react';
import { TourSpotlight } from './components/TourSpotlight.jsx';
import { TourLauncher } from './components/TourSpotlight.jsx';
import { ReleaseTourProvider } from './components/ReleaseTourPrompt.jsx';
export { TourSpotlight, TourLauncher, ReleaseTourProvider };
