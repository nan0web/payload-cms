/** Resolve Payload's stored relative URL for a request or configured origin. */
export function createUrlResolver({ publicOrigin } = {}) {
  return (relativeUrl, request) => {
    const origin = publicOrigin || (request?.protocol && request?.host ? `${request.protocol}://${request.host}` : undefined)
    return origin ? new URL(relativeUrl, origin).href : relativeUrl
  }
}
