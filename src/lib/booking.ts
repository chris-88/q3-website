/**
 * The one place a link into the booking site is built. The contract (agreed with the booking
 * site, chris-88/q3-interiors docs/website-links.md):
 *
 *   https://book.q3interiors.ie/?appointment=<call|visit>[&inspiration=<slug>][&project_type=<label>]
 *     &utm_source=q3website&utm_medium=referral&utm_content=<page>
 *
 * Parameters live in the real query string, never after a hash. Every link carries campaign
 * tags so website visits can be told apart in the booking report: by default the website's own
 * (below). When the visitor arrived with any utm_* tag, `campaign.ts` replaces these defaults in
 * the browser with the visitor's tags, unchanged. Nothing else ever goes in the link.
 */
export const BOOKING_BASE_URL = 'https://book.q3interiors.ie/'

/** The tags a booking link carries when the visitor did not arrive with any. */
export const WEBSITE_CAMPAIGN = { utm_source: 'q3website', utm_medium: 'referral' } as const

export type Appointment = 'call' | 'visit'

/** Where the link sits: `home`, `our-work`, or a project's slug. Becomes `utm_content`. */
export type LinkPage = string

export interface BookingContext {
  /** The project page the visitor is on: its slug becomes `inspiration`. */
  slug: string
  /** An editable suggestion for the booking form, e.g. "Kitchen". Omitted when null. */
  suggestedProjectType: string | null
}

export function bookingLink(
  appointment: Appointment,
  page: LinkPage,
  project?: BookingContext,
): string {
  const params: [string, string][] = [['appointment', appointment]]
  if (project) {
    params.push(['inspiration', project.slug])
    if (project.suggestedProjectType) params.push(['project_type', project.suggestedProjectType])
  }
  params.push(
    ['utm_source', WEBSITE_CAMPAIGN.utm_source],
    ['utm_medium', WEBSITE_CAMPAIGN.utm_medium],
    ['utm_content', page],
  )
  const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `${BOOKING_BASE_URL}?${query}`
}

/** The two appointments, with the facts the copy is allowed to state about them. */
export const APPOINTMENTS = {
  call: { name: 'Phone call', minutes: 20 },
  visit: { name: 'Site visit', minutes: 60 },
} as const satisfies Record<Appointment, { name: string; minutes: number }>
