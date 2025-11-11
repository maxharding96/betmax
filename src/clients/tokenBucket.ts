export class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number // tokens per millisecond
  private readonly jitterMs: number

  constructor(capacity: number, refillRate: number, jitterMs: number) {
    this.capacity = capacity
    this.tokens = capacity
    this.refillRate = refillRate / 1000 // convert to tokens per ms
    this.jitterMs = jitterMs
    this.lastRefill = Date.now()
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const tokensToAdd = elapsed * this.refillRate

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }

    return false
  }

  async consume(tokens: number = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      const tokensNeeded = tokens - this.tokens
      const waitTime = Math.ceil(tokensNeeded / this.refillRate)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  private async applyJitter(): Promise<void> {
    if (this.jitterMs > 0) {
      const delay = Math.random() * this.jitterMs
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
