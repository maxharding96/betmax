import type { Browser } from 'playwright'
import { Scraper } from './scraper'
import type { League } from '@/types/internal'
import { getFixturesPath } from '@/utils/fotmob'
import { teamEnum } from '@/types/fotmob'
import { toFbRefTeam } from '@/utils/fbRef'
import type { Team } from '@/types/fbRef'

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

    console.log(url)

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const links = await page.locator("a[class*='MatchWrapper']").all()

    const hostToFixturePath = new Map<Team, string>()

    for (const link of links) {
      const href = await link.getAttribute('href')
      if (!href) {
        continue
      }

      const span = await link.locator("span[class*='TeamName']").first()
      const unsafeHost = await span.textContent()

      if (!unsafeHost) {
        continue
      }

      const host = teamEnum.safeParse(unsafeHost)

      if (host.error) {
        console.log(`Failed to parse team ${unsafeHost}.`)
        continue
      }

      const team = toFbRefTeam(host.data)

      hostToFixturePath.set(team, href)
    }

    return hostToFixturePath
  }

  async getLineups(path: string) {
    await this.rateLimiter.consume()

    const page = await this.getPage()
    const url = this.baseUrl + path

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const titleLocator = await page
      .locator("h2[class*='LineupTitleCSS']")
      .first()

    const title = await titleLocator.textContent()

    if (title !== '???') {
      return null
    }

    const lineupSection = await page
      .locator("section[class*='LineupFieldContainer']")
      .first()

    const spans = await lineupSection
      .locator("span[class*='LineupPlayerText']")
      .all()

    const players = await Promise.all(
      spans.map((span) => span.getAttribute('title'))
    )
    const lineups = players.filter((p) => p !== null)

    return lineups
  }
}
