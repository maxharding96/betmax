import { roundToTwo } from './common'

export function poissonPMF(k: number, rate: number, weight: number): number {
  if (k < 0 || !Number.isInteger(k)) {
    throw new Error('k must be a non-negative integer')
  }
  const lambda = rate * weight

  if (lambda <= 0) {
    return 0

    // throw new Error('lambda must be positive')
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
    return 999999 // just return huge number, this will get filtered out
  }

  return roundToTwo(1 / probability)
}

export function valueOfOdds({
  predicted,
  real,
}: {
  predicted: number
  real: number
}) {
  return roundToTwo(real / predicted - 1) * 100
}
