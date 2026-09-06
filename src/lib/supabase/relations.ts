export type MaybeArray<T> = T | T[] | null

export function toSingle<T>(rel: MaybeArray<T>): T | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

export function toArray<T>(rel: MaybeArray<T>): T[] {
  if (!rel) return []
  if (Array.isArray(rel)) return rel
  return [rel]
}
