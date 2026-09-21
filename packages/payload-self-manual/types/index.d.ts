/**
 * Configure payload-self-manual plugin with UI options and release notification controls
 */
export function payloadSelfManual(options?: {}): (config: any) => any;
import { getTranslator } from './i18n.js';
import { loadVocabulary } from './i18n.js';
import { SelfManualConfigModel } from './SelfManualConfigModel.js';
import { renderMarkdown } from './server/markdown-renderer.js';
import { isMermaidFence } from './server/markdown-renderer.js';
import { escapeHtml } from './server/markdown-renderer.js';
import { resolveDocPath } from './server/doc-loader.js';
import { scanDocumentationIndex } from './server/doc-loader.js';
import { loadDocumentation } from './server/doc-loader.js';
import { inspectPlugins } from './server/plugins-inspector.js';
import { createDocumentationEndpoint } from './server/endpoint.js';
export { getTranslator, loadVocabulary, SelfManualConfigModel, renderMarkdown, isMermaidFence, escapeHtml, resolveDocPath, scanDocumentationIndex, loadDocumentation, inspectPlugins, createDocumentationEndpoint };
