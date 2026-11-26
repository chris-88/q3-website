import { z } from 'zod'

/**
 * The business's public details, read once at build time from the booking backend's public
 * function `public_business_details()` (the same one book.q3interiors.ie shows). Nothing here is
 * hard-coded: a field the business has not filled in is null and is not shown. If the call fails
 * the site builds without contact details rather than failing.
 */
const text = z.string().trim().min(1).nullable().catch(null)

const publicBusinessSchema = z.object({
  trading_name: z.string().trim().min(1).catch('Q3 Interiors'),
  legal_name: text.default(null),
  contact_phone: text.default(null),
  contact_email: text.default(null),
  service_area: text.default(null),
  privacy_contact: text.default(null),
})

export type PublicBusiness = z.infer<typeof publicBusinessSchema>

export interface BusinessEnv {
  Q3_API_URL?: string | undefined
  Q3_API_ANON_KEY?: string | undefined
}

export function parseBusiness(data: unknown): PublicBusiness | null {
  const parsed = publicBusinessSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

export async function fetchBusiness(
  env: BusinessEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicBusiness | null> {
  const base = env.Q3_API_URL?.replace(/\/+$/, '')
  const key = env.Q3_API_ANON_KEY
  if (!base || !key) {
    console.warn(
      '[business] Q3_API_URL or Q3_API_ANON_KEY not set: building without contact details',
    )
    return null
  }
  try {
    const res = await fetchImpl(`${base}/rest/v1/rpc/public_business_details`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const business = parseBusiness(await res.json())
    if (!business) throw new Error('unexpected response shape')
    const shown = Object.entries(business)
      .filter(([, v]) => v !== null)
      .map(([k]) => k)
    console.info(`[business] contact details loaded: ${shown.join(', ')}`)
    return business
  } catch (error) {
    console.warn(`[business] could not load contact details (${String(error)}): building without`)
    return null
  }
}

let cached: Promise<PublicBusiness | null> | undefined

/** One call per build, shared by every page. */
export function loadBusiness(): Promise<PublicBusiness | null> {
  cached ??= fetchBusiness(process.env)
  return cached
}

/** A phone number as a tel: link target: digits and a leading +. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
