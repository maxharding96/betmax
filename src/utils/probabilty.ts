import { roundToTwo } from './common'

export function poissonPMF(k: number, rate: number, weight: number): number {
  if (k < 0 || !Number.isInteger(k)) {
    throw new Error('k must be a non-negative integer')
  }
  const lambda = rate * weight

  if (lambda <= 0) {
    throw new Error('lambda must be positive')
  }

  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

// Helper function for factorial
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

// Cumulative Distribution Function (CDF)
export function poissonCDF(k: number, rate: number, weight: number): number {
  let sum = 0
  for (let i = 0; i <= k; i++) {
    sum += poissonPMF(i, rate, weight)
  }
  return sum
}

export function poissonGreaterOrEqual(
  k: number,
  rate: number,
  weight: number
): number {
  if (k === 0) {
    return 1 // P(X ≥ 0) = 1 (always true)
  }
  const cdfValue = poissonCDF(k, rate, weight)
  return 1 - cdfValue
}

export function oddsOfProbability(probability: number) {
  if (probability <= 0 || probability >= 1) {
    throw new Error('Probability must be between 0 and 1 (exclusive)')
  }

  return roundToTwo(1 / probability)
}

export function estGamePlayedWhenStarting({
  matchesPlayed,
  minutesPlayed,
  starts,
}: {
  matchesPlayed: number
  minutesPlayed: number
  starts: number
}) {
  if (starts === 0) {
    return 1
  }

  // Most subs happen between the 60th and 85th minute
  const AVERAGE_SUB_MINS = 17.5

  const totalMinWhenStarting =
    minutesPlayed - (matchesPlayed - starts) * AVERAGE_SUB_MINS

  const avgMinWhenStarting = totalMinWhenStarting / starts

  return roundToTwo(Math.min(avgMinWhenStarting / 90, 1))
}
