/**
 * Inspects active plugins and system configuration from Payload config.
 *
 * @param {Object} [config={}] Payload configuration object
 * @returns {{ plugins: Array<{ id: string, name: string, title: string, version?: string, status: string, hasDocs: boolean, docsDir?: string, options?: any }> }}
 */
export function inspectPlugins(config?: any): {
    plugins: Array<{
        id: string;
        name: string;
        title: string;
        version?: string;
        status: string;
        hasDocs: boolean;
        docsDir?: string;
        options?: any;
    }>;
};
