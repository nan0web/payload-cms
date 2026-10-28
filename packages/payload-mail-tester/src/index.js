import { MailTesterConfigModel } from './MailTesterConfigModel.js'
import { payloadMailAdapter, resolveTransportConfig, createMailTransporter } from './adapter.js'
import { createMailTesterEndpoint } from './endpoint.js'

export {
  MailTesterConfigModel,
  payloadMailAdapter,
  resolveTransportConfig,
  createMailTransporter,
  createMailTesterEndpoint,
}

const VIEW_COMPONENT_PATH = '@nan0web/payload-mail-tester/admin#MailTesterView'
const NAV_LINK_COMPONENT_PATH = '@nan0web/payload-mail-tester/admin#MailTesterNavLink'

/**
 * Configure payload-mail-tester plugin for Payload CMS.
 *
 * @param {Object} [options]
 * @param {string} [options.group='Settings'] Admin navigation group
 * @param {string} [options.path='/mail-tester'] Admin view path
 * @param {import('./adapter.js').MailAdapterOptions} [options.adapterOptions] Custom options for the mail tester endpoint
 * @returns {(config: any) => any}
 */
export function payloadMailTester(options = {}) {
  const group = options.group || 'Settings'
  const viewPath = options.path || '/mail-tester'
  const endpointHandler = createMailTesterEndpoint({ adapterOptions: options.adapterOptions })

  return (config) => {
    // 1. Add diagnostic endpoint
    const existingEndpoints = Array.isArray(config.endpoints) ? config.endpoints : []
    const endpoints = [
      ...existingEndpoints,
      {
        path: '/mail-tester',
        method: 'get',
        handler: endpointHandler,
      },
      {
        path: '/mail-tester',
        method: 'post',
        handler: endpointHandler,
      },
    ]

    // 2. Add admin custom view & afterNavLinks navigation link
    const existingViews = config.admin?.views || {}
    const existingAfterNavLinks = Array.isArray(config.admin?.components?.afterNavLinks)
      ? config.admin.components.afterNavLinks
      : config.admin?.components?.afterNavLinks
        ? [config.admin.components.afterNavLinks]
        : []

    return {
      ...config,
      endpoints,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          afterNavLinks: [
            ...existingAfterNavLinks,
            NAV_LINK_COMPONENT_PATH,
          ],
          views: {
            ...config.admin?.components?.views,
            mailTester: {
              Component: VIEW_COMPONENT_PATH,
              path: viewPath,
              exact: true,
              meta: {
                title: 'Mail Tester',
                description: 'Mail server diagnostics and deliverability tester',
              },
            },
          },
        },
        views: {
          ...existingViews,
          mailTester: {
            Component: VIEW_COMPONENT_PATH,
            path: viewPath,
            exact: true,
            meta: {
              title: 'Mail Tester',
              description: 'Mail server diagnostics and deliverability tester',
            },
          },
        },
      },
    }
  }
}

export default payloadMailTester
