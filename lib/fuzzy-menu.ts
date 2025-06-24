import Fuse from 'fuse.js'

/**
 * Build a Fuse.js instance for fuzzy-matching menu item names.
 * Threshold 0.4 gives decent balance: “Gaia” ➔ “Gaia Experience”,
 * but ignores very loose matches that could cause false positives.
 */
export function buildMenuFuse(menuItems: { name: string }[]) {
  return new Fuse(menuItems, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
  })
}

/**
 * Return the best-matching canonical name for a user-supplied token.
 * If no match passes the threshold, returns null.
 */
export function findClosestName(
  fuse: Fuse<{ name: string }>,
  query: string
): string | null {
  if (!query) return null
  const result = fuse.search(query.trim())
  return result.length > 0 ? result[0].item.name : null
}
