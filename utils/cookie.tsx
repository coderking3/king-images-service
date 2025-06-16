import type { H3Event } from 'h3'

const getCertificate = (event: H3Event, key: string) => {
  const cookie = getHeader(event, 'X-Certificate-Cookie')
  if (!cookie) return null

  const matchResult = cookie.match(new RegExp(`${key}=(.*?)(;|$)`))
  if (!matchResult || !matchResult[1]) return null

  const cert = matchResult[1]
  return cert
}

export { getCertificate }
