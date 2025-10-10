import type { Browser, Page } from 'playwright'

export class Scraper {
  protected baseUrl: string
  protected browser: Browser
  protected page?: Page

  constructor({ baseUrl, browser }: { baseUrl: string; browser: Browser }) {
    this.baseUrl = baseUrl
    this.browser = browser
  }

  async getPage() {
    if (!this.page) {
      this.page = await this.browser.newPage()
    }

    return this.page
  }
}
