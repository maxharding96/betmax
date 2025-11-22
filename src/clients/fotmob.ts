import type { Browser } from 'playwright'
import { Scraper } from './scraper'
import type { League } from '@/types/internal'
import { getFixturesPath } from '@/utils/fotmob'

export class FotMobClient extends Scraper {
  constructor(browser: Browser) {
    super({
      baseUrl: 'https://www.fotmob.com',
      browser,
    })
  }

  async getFixtures({ league }: { league: League }) {
    await this.rateLimiter.consume()

    const page = await this.getPage()

    const url = this.baseUrl + getFixturesPath(league)

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const links = await page.locator("a[class*='MatchWrapper']").all()

    const hostToFixturePath = new Map<string, string>()

    for (const link of links) {
      const href = await link.getAttribute('href')
      if (!href) {
        continue
      }

      const span = await link.locator("span[class*='TeamName']").first()
      const host = await span.textContent()

      if (!host) {
        continue
      }

      hostToFixturePath.set(host, href)
    }

    return hostToFixturePath
  }

  async getLineups(path: string) {
    await this.rateLimiter.consume()

    const page = await this.getPage()
    const url = this.baseUrl + path

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const spans = await page.locator("span[class*='LineupPlayerText']").all()

    const players = await Promise.all(spans.map((span) => span.textContent()))
    const lineups = players.filter((p) => p !== null)

    return lineups.length ? lineups : null
  }
}
