import type { Browser, Page } from 'playwright'
import { TokenBucket } from './tokenBucket'

export class Scraper {
  protected baseUrl: string
  protected browser: Browser
  protected rateLimiter: TokenBucket
  protected page?: Page

  constructor({ baseUrl, browser }: { baseUrl: string; browser: Browser }) {
    this.baseUrl = baseUrl
    this.browser = browser
    this.rateLimiter = new TokenBucket(1, 1 / 3, 1000) // for now default 1 request per 3 seconds, up to 1s jitter
  }

  async getPage() {
    if (!this.page) {
      this.page = await this.browser.newPage()
    }

    return this.page
  }
}
