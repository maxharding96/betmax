export function isDateWithin(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)

  const today = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return today <= date && date < future
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function slugify(str: string) {
  return str.toLowerCase().replaceAll(' ', '-')
}

export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100
}

export function fractionToDecimal(fraction: string): number {
  const [numeratorStr, denominatorStr] = fraction.split('/')

  const numerator = parseInt(numeratorStr, 10)
  const denominator = parseInt(denominatorStr, 10)

  return roundToTwo(1 + numerator / denominator)
}

// Jaro-Winkler similarity (better for names)
function jaroWinklerSimilarity(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2)

  // Calculate common prefix (up to 4 chars)
  let prefix = 0
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++
    else break
  }

  // Winkler modification: boost score if common prefix exists
  return jaro + prefix * 0.1 * (1 - jaro)
}

function jaroSimilarity(s1: string, s2: string): number {
  if (s1.length === 0 && s2.length === 0) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  const s1Matches = new Array(s1.length).fill(false)
  const s2Matches = new Array(s2.length).fill(false)

  let matches = 0
  let transpositions = 0

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, s2.length)

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  // Count transpositions
  let k = 0
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++
    k++
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3
  )
}

// Normalize names for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
}

// Token-based matching for reordered names
function tokenBasedSimilarity(name1: string, name2: string): number {
  const tokens1 = name1.split(' ').filter((t) => t.length > 0)
  const tokens2 = name2.split(' ').filter((t) => t.length > 0)

  if (tokens1.length === 0 || tokens2.length === 0) return 0

  let totalScore = 0
  let matchCount = 0

  for (const token1 of tokens1) {
    let bestMatch = 0
    for (const token2 of tokens2) {
      const score = jaroWinklerSimilarity(token1, token2)
      bestMatch = Math.max(bestMatch, score)
    }
    if (bestMatch > 0.8) {
      // Token matches if > 80% similar
      totalScore += bestMatch
      matchCount++
    }
  }

  // Average score, penalized by unmatched tokens
  const matchRatio = matchCount / Math.max(tokens1.length, tokens2.length)
  return matchCount > 0 ? (totalScore / matchCount) * matchRatio : 0
}

// Main matching function combining both approaches
function matchPlayerName(name1: string, name2: string): number {
  const norm1 = normalizeName(name1)
  const norm2 = normalizeName(name2)

  // Direct Jaro-Winkler comparison
  const directScore = jaroWinklerSimilarity(norm1, norm2)

  // Token-based comparison (handles reordering)
  const tokenScore = tokenBasedSimilarity(norm1, norm2)

  // Use the higher of the two scores
  return Math.max(directScore, tokenScore)
}

export function findBestPlayerMatch(
  targetName: string,
  playerList: string[],
  threshold: number = 0.85
): { name: string; score: number } | null {
  let bestMatch: string | null = null
  let bestScore = threshold

  for (const player of playerList) {
    const score = matchPlayerName(targetName, player)

    if (score > bestScore) {
      bestScore = score
      bestMatch = player
    }
  }

  return bestMatch ? { name: bestMatch, score: bestScore } : null
}

export const getOrCreate = <K, V>(
  map: Map<K, V>,
  key: K,
  create: () => V
): V => {
  if (!map.has(key)) {
    map.set(key, create())
  }
  return map.get(key)!
}

export const appendOrCreate = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  const arr = map.get(key)
  if (arr) {
    arr.push(value)
  } else {
    map.set(key, [value])
  }
}

export function zip<T extends any[][]>(
  ...arrays: T
): Array<{ [K in keyof T]: T[K] extends Array<infer U> ? U : never }> {
  if (arrays.length === 0) return []

  const minLength = Math.min(...arrays.map((arr) => arr.length))
  const result: any[] = []

  for (let i = 0; i < minLength; i++) {
    result.push(arrays.map((arr) => arr[i]))
  }

  return result
}
