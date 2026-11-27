import { z } from 'zod'
import raw from '../data/projects.json'

const image = z.object({
  path: z.string().regex(/^assets\/projects\/[a-z0-9-]+\.(webp|jpe?g|png|avif)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  location: z.string().min(1),
  audience: z.enum(['Homes', 'Workplaces']),
  suggestedProjectType: z.string().min(1).nullable(),
  alt: z.string().min(1),
  description: z.string().min(1),
  /** How long the job took, as said to a customer: "3 weeks", "A week and a half". */
  duration: z.string().trim().min(1),
  images: z.object({ small: image, wide: image }),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectImage = z.infer<typeof image>

/** Every project, in the order the gallery shows them. Parsed at build time: bad data fails the build. */
export const projects: readonly Project[] = z.array(projectSchema).min(1).parse(raw)

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

/** The neighbours in gallery order, wrapping round so every page has both. */
export function neighbours(slug: string): { previous: Project; next: Project } {
  const i = projects.findIndex((p) => p.slug === slug)
  if (i < 0) throw new Error(`Unknown project: ${slug}`)
  const n = projects.length
  // Indices are in range by construction; the assertion satisfies noUncheckedIndexedAccess.
  return { previous: projects[(i - 1 + n) % n]!, next: projects[(i + 1) % n]! }
}

export const projectPath = (p: Pick<Project, 'slug'>) => `/our-work/${p.slug}/`
export const imageUrl = (img: ProjectImage) => `/${img.path}`

/** A srcset of the files we have. Never lists a width bigger than the file. */
export function srcset(p: Project): string {
  const { small, wide } = p.images
  return `${imageUrl(small)} ${small.width}w, ${imageUrl(wide)} ${wide.width}w`
}
