import crypto from 'node:crypto'

export function verifySignature(payload: string, secret: string, signature: string) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const digest = `sha256=${hmac.digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}
