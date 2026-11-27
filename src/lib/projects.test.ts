import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { neighbours, projects, srcset } from './projects'

/** Width and height from a WebP header (VP8, VP8L or VP8X). */
function webpSize(file: string): { width: number; height: number } {
  const b = readFileSync(file)
  const kind = b.toString('ascii', 12, 16)
  if (kind === 'VP8 ')
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (kind === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 }
  throw new Error(`Not a WebP file: ${file}`)
}

describe('projects', () => {
  it('has the six agreed projects, four homes and two workplaces', () => {
    expect(projects.map((p) => p.slug)).toEqual([
      'donabate',
      'fairview',
      'fitzwilliam-office',
      'castleknock',
      'fitzwilliam-bathroom',
      'adelaide',
    ])
    expect(projects.filter((p) => p.audience === 'Homes')).toHaveLength(4)
    expect(projects.filter((p) => p.audience === 'Workplaces')).toHaveLength(2)
  })

  it('gives every project how long the job took', () => {
    expect(Object.fromEntries(projects.map((p) => [p.slug, p.duration]))).toEqual({
      donabate: '3 weeks',
      fairview: '1 month',
      'fitzwilliam-office': '3 months',
      castleknock: 'A week and a half',
      'fitzwilliam-bathroom': '4 weeks',
      adelaide: '6 weeks',
    })
  })

  it('records the true size of every photo, and the wide file is the larger', () => {
    for (const p of projects) {
      for (const img of [p.images.small, p.images.wide]) {
        if (!img.path.endsWith('.webp')) continue
        expect(webpSize(`public/${img.path}`), img.path).toEqual({
          width: img.width,
          height: img.height,
        })
      }
      expect(p.images.wide.width).toBeGreaterThanOrEqual(p.images.small.width)
    }
  })

  it('lists both files in the srcset at their real widths', () => {
    expect(srcset(projects[0]!)).toBe(
      '/assets/projects/donabate-small.webp 480w, /assets/projects/donabate-wide.webp 800w',
    )
  })

  it('wraps previous and next round the ends', () => {
    expect(neighbours('donabate').previous.slug).toBe('adelaide')
    expect(neighbours('adelaide').next.slug).toBe('donabate')
    expect(neighbours('fairview')).toMatchObject({
      previous: { slug: 'donabate' },
      next: { slug: 'fitzwilliam-office' },
    })
  })
})
