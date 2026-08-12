/** Create a backend-neutral redirect record. */
export function createRedirect({ from, to, statusCode = 302, expiresAt = null, resourceType = 'media' }) {
  if (![301, 302].includes(statusCode)) throw new RangeError('statusCode must be 301 or 302')
  return { from, to, statusCode, expiresAt, resourceType, createdAt: new Date(), updatedAt: new Date() }
}

export function createRedirectResolver({ lookup, authorize = async () => true }) {
  return async function resolve(url, context) {
    const redirect = await lookup(url)
    if (!redirect || (redirect.expiresAt && new Date(redirect.expiresAt) <= new Date())) return null
    if (!(await authorize(redirect.to, context))) return null
    return redirect
  }
}
