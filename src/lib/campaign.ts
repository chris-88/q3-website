import { BOOKING_BASE_URL } from './booking'

/** The only query parameters this site ever carries from one page to the next. */
export const CAMPAIGN_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

const BOOKING_ORIGIN = new URL(BOOKING_BASE_URL).origin

/** The campaign tags present (and non-empty) on a page's query string, in a fixed order. */
export function campaignFrom(search: string): [string, string][] {
  const params = new URLSearchParams(search)
  const out: [string, string][] = []
  for (const key of CAMPAIGN_KEYS) {
    const value = params.get(key)
    if (value) out.push([key, value])
  }
  return out
}

const isCampaignKey = (key: string) => (CAMPAIGN_KEYS as readonly string[]).includes(key)

/** The raw `k=v` pairs of a query, as written (encoding untouched). */
const rawPairs = (search: string) => search.replace(/^\?/, '').split('&').filter(Boolean)
const rawKey = (pair: string) => {
  try {
    return decodeURIComponent(pair.split('=')[0] ?? '')
  } catch {
    return ''
  }
}

const encode = (pairs: [string, string][]) => pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)

/**
 * Applies the visitor's campaign tags to a link. Returns null when the link should be left alone
 * (another site, mailto:, tel:, no tags on the page, nothing to change).
 *
 * - Booking links: the website's default tags (utm_source=q3website...) are removed and the
 *   visitor's tags put in their place, unchanged, so an ad gets the credit for the booking.
 * - Internal links: the tags are added so the next page can do the same; a tag already set on the
 *   destination wins.
 */
export function withCampaign(
  href: string,
  campaign: [string, string][],
  pageUrl: string,
): string | null {
  if (campaign.length === 0) return null
  let url: URL
  try {
    url = new URL(href, pageUrl)
  } catch {
    return null
  }
  const page = new URL(pageUrl)
  const internal = url.origin === page.origin
  if (!internal && url.origin !== BOOKING_ORIGIN) return null

  // Work on the query as written, so the destination's own encoding is left untouched.
  let pairs = rawPairs(url.search)
  if (internal) {
    const missing = campaign.filter(([key]) => !url.searchParams.has(key))
    if (missing.length === 0) return null
    pairs = [...pairs, ...encode(missing)]
  } else {
    pairs = [...pairs.filter((p) => !isCampaignKey(rawKey(p))), ...encode(campaign)]
  }
  const search = pairs.length ? `?${pairs.join('&')}` : ''
  if (search === url.search) return null
  url.search = search
  return internal ? `${url.pathname}${url.search}${url.hash}` : url.toString()
}

/** Rewrites every eligible link in the document. Links work unchanged without it. */
export function carryCampaign(doc: Document): void {
  const campaign = campaignFrom(doc.location.search)
  if (campaign.length === 0) return
  for (const a of doc.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const next = withCampaign(a.getAttribute('href') ?? '', campaign, doc.location.href)
    if (next) a.setAttribute('href', next)
  }
}
