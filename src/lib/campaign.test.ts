import { describe, expect, it } from 'vitest'
import { campaignFrom, withCampaign } from './campaign'

const page = 'https://q3interiors.ie/our-work/?utm_source=instagram&utm_campaign=kitchens'

describe('campaignFrom', () => {
  it('keeps only the five utm tags, non-empty, in a fixed order', () => {
    expect(
      campaignFrom('?fbclid=x&utm_term=tiles&utm_source=ig&utm_medium=&gclid=y&utm_content=a'),
    ).toEqual([
      ['utm_source', 'ig'],
      ['utm_content', 'a'],
      ['utm_term', 'tiles'],
    ])
    expect(campaignFrom('')).toEqual([])
  })
})

describe('withCampaign', () => {
  const campaign = campaignFrom(new URL(page).search)

  it("puts the visitor's tags on booking links in place of the website's own", () => {
    expect(
      withCampaign(
        'https://book.q3interiors.ie/?appointment=call&utm_source=q3website&utm_medium=referral&utm_content=home',
        campaign,
        page,
      ),
    ).toBe(
      'https://book.q3interiors.ie/?appointment=call&utm_source=instagram&utm_campaign=kitchens',
    )
  })

  it("carries the visitor's tags through unchanged, even ones the website also sets", () => {
    const tagged = campaignFrom('?utm_source=ig&utm_content=reel%202&utm_term=tiles')
    expect(
      withCampaign(
        'https://book.q3interiors.ie/?appointment=visit&inspiration=fairview&project_type=Kitchen&utm_source=q3website&utm_medium=referral&utm_content=fairview',
        tagged,
        page,
      ),
    ).toBe(
      'https://book.q3interiors.ie/?appointment=visit&inspiration=fairview&project_type=Kitchen&utm_source=ig&utm_content=reel%202&utm_term=tiles',
    )
  })

  it("leaves the website's own tags in place when the visitor brought none", () => {
    const href =
      'https://book.q3interiors.ie/?appointment=call&utm_source=q3website&utm_medium=referral&utm_content=home'
    expect(withCampaign(href, campaignFrom('?gclid=abc'), page)).toBeNull()
  })

  it('adds the tags to internal links, keeping them relative and keeping the hash', () => {
    expect(withCampaign('/our-work/fairview/', campaign, page)).toBe(
      '/our-work/fairview/?utm_source=instagram&utm_campaign=kitchens',
    )
    expect(withCampaign('/#book', campaign, page)).toBe(
      '/?utm_source=instagram&utm_campaign=kitchens#book',
    )
    // A same-page anchor already sits on a URL with the tags: nothing to change.
    expect(withCampaign('#book', campaign, page)).toBeNull()
  })

  it('leaves the destination parameters exactly as they were encoded', () => {
    expect(
      withCampaign(
        'https://book.q3interiors.ie/?appointment=call&project_type=Workplace%20fit-out&utm_source=q3website',
        [['utm_campaign', 'spring offer']],
        page,
      ),
    ).toBe(
      'https://book.q3interiors.ie/?appointment=call&project_type=Workplace%20fit-out&utm_campaign=spring%20offer',
    )
  })

  it('keeps a value already set on the destination', () => {
    expect(withCampaign('/privacy/?utm_source=email', campaign, page)).toBe(
      '/privacy/?utm_source=email&utm_campaign=kitchens',
    )
  })

  it('leaves other sites, mail and phone links, and pages without tags alone', () => {
    expect(withCampaign('https://example.com/', campaign, page)).toBeNull()
    expect(withCampaign('mailto:hello@example.com', campaign, page)).toBeNull()
    expect(withCampaign('tel:0871234567', campaign, page)).toBeNull()
    expect(withCampaign('/our-work/', [], page)).toBeNull()
  })
})
