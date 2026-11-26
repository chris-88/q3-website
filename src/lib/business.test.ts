import { describe, expect, it, vi } from 'vitest'
import { fetchBusiness, parseBusiness, telHref } from './business'

const env = { Q3_API_URL: 'https://api.example.test/q3/', Q3_API_ANON_KEY: 'anon' }
const ok = (body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch

describe('business details', () => {
  it('keeps the public fields and treats blanks as not set', () => {
    expect(
      parseBusiness({
        trading_name: 'Q3 Interiors',
        contact_phone: '01 234 5678',
        contact_email: '  ',
        postal_address: 'not shown on this site',
        newer_field: true,
      }),
    ).toEqual({
      trading_name: 'Q3 Interiors',
      legal_name: null,
      contact_phone: '01 234 5678',
      contact_email: null,
      service_area: null,
      privacy_contact: null,
    })
  })

  it('calls the public function with the anon key', async () => {
    const f = ok({ trading_name: 'Q3 Interiors', contact_email: 'a@b.ie' })
    const b = await fetchBusiness(env, f)
    expect(b?.contact_email).toBe('a@b.ie')
    expect(f).toHaveBeenCalledWith(
      'https://api.example.test/q3/rest/v1/rpc/public_business_details',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('builds without details when the call fails or is not configured', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const down = vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch
    expect(await fetchBusiness(env, down)).toBeNull()
    const thrown = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await fetchBusiness(env, thrown)).toBeNull()
    expect(await fetchBusiness({}, ok({ trading_name: 'x' }))).toBeNull()
    expect(await fetchBusiness(env, ok(['not', 'an', 'object']))).toBeNull()
  })

  it('makes a dialable tel: link', () => {
    expect(telHref('087 123 4567')).toBe('tel:0871234567')
    expect(telHref('+353 (87) 123-4567')).toBe('tel:+353871234567')
  })
})
