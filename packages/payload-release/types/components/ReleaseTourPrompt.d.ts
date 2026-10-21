/**
 * Global Release Tour Provider & Floater/Modal for Payload CMS Admin.
 * Runs on any admin route via config.admin.components.providers.
 * Detects unseen releases (multi-version support) and displays an unobtrusive
 * announcement card / modal dialog with options to take the tour.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.JSX.Element}
 */
export function ReleaseTourProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
import React from 'react';
