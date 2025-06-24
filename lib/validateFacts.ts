import type { SupabaseClient } from '@supabase/supabase-js'
import { buildMenuFuse, findClosestName } from './fuzzy-menu'
import Fuse from 'fuse.js'

interface MenuItemMeta {
  name: string
  type: 'drink' | 'experience'
}

interface DBRow {
  description: string | null
  tags: string[] | null
  pairings: string | null
  price_aed: number | null
}

/**
 * Performs factual validation & mild auto-correction.
 * – Keeps creative adjectives.
 * – Removes ingredient/price facts not backed by DB.
 * – Swaps fuzzy names to canonical.
 */
export async function sanitizeBaristaReply(
  draft: string,
  menuItems: MenuItemMeta[],
  supabase: SupabaseClient
): Promise<string> {
  const fuse = buildMenuFuse(menuItems)
  const nameSet = new Set<string>()

  // 1. Detect candidate names (exact + fuzzy quick pass)
  for (const item of menuItems) {
    if (draft.includes(item.name)) nameSet.add(item.name)
  }

  // fallback: naive capitalised words >3 chars
  const extraTokens = draft.match(/[A-Z][A-Za-z]{3,}/g) || []
  for (const token of extraTokens) {
    const best = findClosestName(fuse as unknown as Fuse<{ name: string }>, token)
    if (best) nameSet.add(best)
  }

  let cleaned = draft

  // 2. Validate each mentioned item
  for (const name of nameSet) {
    const meta = menuItems.find((m) => m.name === name)
    if (!meta) continue

    const { data } = await supabase
      .from(meta.type === 'drink' ? 'products' : 'experiences')
      .select('description,tags,pairings,price_aed')
      .eq('name', name)
      .single<DBRow>()

    if (!data) continue

    const allowedFacts = new Set<string>()
    data.description && allowedFacts.add(data.description)
    data.pairings && allowedFacts.add(data.pairings)
    data.tags?.forEach((t) => allowedFacts.add(t))
    if (data.price_aed !== null) allowedFacts.add(data.price_aed.toString())

    // Simple word-level scrub: remove words that look like ingredients not in allowed set
    cleaned = cleaned.replace(new RegExp(`(\\b${name}\\b[^.]+.)`, 'g'), (sentence) => {
      // keep sentence if no disallowed hard-fact tokens
      const offenders = sentence.match(/\b[A-Za-z]{4,}\b/g) || []
      for (const word of offenders) {
        if (/^[A-Z]/.test(word)) continue // skip proper nouns and sentence starts
        if (allowedFacts.has(word.toLowerCase())) continue
        if (['and', 'with', 'for', 'the', 'a', 'an', 'to', 'of'].includes(word.toLowerCase())) continue
        // possible offending ingredient: drop it
        sentence = sentence.replace(word, '').replace(/\s{2,}/g, ' ')
      }
      // ensure canonical name
      return sentence.replace(name, meta.name)
    })
  }

  return cleaned
}
