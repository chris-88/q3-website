import { describe, expect, it } from 'vitest'
import { BOOKING_BASE_URL, bookingLink } from './booking'
import { projects } from './projects'

const site = (page: string) => `utm_source=q3website&utm_medium=referral&utm_content=${page}`

describe('bookingLink', () => {
  it('uses the one booking base, with the parameters in the real query string', () => {
    expect(BOOKING_BASE_URL).toBe('https://book.q3interiors.ie/')
    expect(bookingLink('call', 'home')).toBe(
      `https://book.q3interiors.ie/?appointment=call&${site('home')}`,
    )
    expect(bookingLink('visit', 'our-work')).toBe(
      `https://book.q3interiors.ie/?appointment=visit&${site('our-work')}`,
    )
    expect(bookingLink('call', 'home')).not.toContain('#')
  })

  it('adds inspiration always and project_type only when suggested', () => {
    expect(
      bookingLink('visit', 'fairview', { slug: 'fairview', suggestedProjectType: 'Kitchen' }),
    ).toBe(
      `https://book.q3interiors.ie/?appointment=visit&inspiration=fairview&project_type=Kitchen&${site('fairview')}`,
    )
    expect(bookingLink('call', 'donabate', { slug: 'donabate', suggestedProjectType: null })).toBe(
      `https://book.q3interiors.ie/?appointment=call&inspiration=donabate&${site('donabate')}`,
    )
  })

  it('encodes a label with a space so any query parser reads it back', () => {
    const href = bookingLink('call', 'fitzwilliam-office', {
      slug: 'fitzwilliam-office',
      suggestedProjectType: 'Workplace fit-out',
    })
    expect(href).toBe(
      `https://book.q3interiors.ie/?appointment=call&inspiration=fitzwilliam-office&project_type=Workplace%20fit-out&${site('fitzwilliam-office')}`,
    )
    expect(new URL(href).searchParams.get('project_type')).toBe('Workplace fit-out')
  })

  it('gives each project the agreed suggestion', () => {
    const types = Object.fromEntries(projects.map((p) => [p.slug, p.suggestedProjectType]))
    expect(types).toEqual({
      donabate: null,
      fairview: 'Kitchen',
      'fitzwilliam-office': 'Workplace fit-out',
      castleknock: 'Bathroom',
      'fitzwilliam-bathroom': 'Bathroom',
      adelaide: null,
    })
  })

  it('never carries anything but the documented parameters', () => {
    const allowed = [
      'appointment',
      'inspiration',
      'project_type',
      'utm_source',
      'utm_medium',
      'utm_content',
    ]
    for (const p of projects) {
      for (const a of ['call', 'visit'] as const) {
        const keys = [...new URL(bookingLink(a, p.slug, p)).searchParams.keys()]
        for (const k of keys) expect(allowed).toContain(k)
      }
    }
  })
})
