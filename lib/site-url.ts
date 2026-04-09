/** Base URL for auth redirects (Supabase + e-mails). No trailing slash. */
export function getPublicSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}
