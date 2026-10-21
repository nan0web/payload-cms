/**
 * Interactive SVG Spotlight and Popover for Product Onboarding Tour.
 * Zero external dependencies. Uses CSS/SVG mask and Theme tokens.
 *
 * @param {Object} props
 * @param {import('../domain/TourStepModel.js').TourManifestModel} props.tour
 * @param {boolean} [props.isOpen]
 * @param {() => void} [props.onClose]
 * @param {(step: number) => void} [props.onStepChange]
 * @param {() => void} [props.onComplete]
 * @returns {React.JSX.Element|null}
 */
export function TourSpotlight({ tour, isOpen, onClose, onStepChange, onComplete, }: {
    tour: import("../domain/TourStepModel.js").TourManifestModel;
    isOpen?: boolean | undefined;
    onClose?: (() => void) | undefined;
    onStepChange?: ((step: number) => void) | undefined;
    onComplete?: (() => void) | undefined;
}): React.JSX.Element | null;
/**
 * Button to launch a product tour for a release.
 *
 * @param {Object} props
 * @param {any} props.release
 * @param {string} [props.label]
 * @returns {React.JSX.Element|null}
 */
export function TourLauncher({ release, label, autoStart }: {
    release: any;
    label?: string | undefined;
}): React.JSX.Element | null;
import React from 'react';
