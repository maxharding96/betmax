import type { Browser, Locator, Page } from 'playwright'
import type {
  GetFieldOddsOutput,
  GetFieldOddsInput,
  GetMatchesInput,
  GetMatchesOutput,
  GetOddsInput,
  GetOddsOutput,
  Match,
  Odds,
} from '../types/oddsChecker'
import { teamEnum } from '../types/oddsChecker'
import { leagueToPath, matchToPath } from '../utils/oddsChecker'
import { fractionToDecimal } from '../utils/common'
import { Scraper } from './scraper'
import { bettingFieldType } from '../types/internal'

export class OddsCheckerClient extends Scraper {
  constructor(browser: Browser) {
    super({
      baseUrl: 'https://www.oddschecker.com/football',
      browser,
    })
  }

  async getMatches(input: GetMatchesInput): Promise<GetMatchesOutput> {
    const { league } = input

    const url = this.baseUrl + leagueToPath(league)

    const page = await this.getPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    let locator: Locator

    switch (league) {
      case 'Premier League':
      case 'Championship':
        locator = page.locator('div[class^="TeamWrapper"]')
        break
      case 'League 1':
        locator = page.locator('p.fixtures-bet-name.beta-footnote')
    }

    const count = await locator.count()

    const matches: Match[] = []

    for (let i = 0; i < count; i += 2) {
      const unsafeHome = await locator.nth(i).textContent()
      const unsafeAway = await locator.nth(i + 1).textContent()

      const home = teamEnum.parse(unsafeHome)
      const away = teamEnum.parse(unsafeAway)

      matches.push({ league, home, away })
    }

    return {
      matches,
    }
  }

  async getOdds(input: GetOddsInput): Promise<GetOddsOutput | null> {
    const { fields, match } = input

    const url = this.baseUrl + matchToPath(match)

    const page = await this.getPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const timeElements = page.locator('time')
    const timeElement = timeElements.nth(0)
    const datetimeString = await timeElement.getAttribute('datetime')
    if (!datetimeString) {
      return null
    }

    const playerBettingButton = await page.locator(
      '#market_filters_Player-Betting_Player-Betting'
    )
    const buttonCount = await playerBettingButton.count()
    if (buttonCount === 0) {
      return null
    }

    await playerBettingButton.click({ force: true })

    const oddsByField: GetFieldOddsOutput[] = []

    for (const field of fields) {
      const odds = await this.getFieldOdds({ field }, page)
      if (odds) {
        oddsByField.push(odds)
      }
    }

    return {
      match,
      oddsByField,
    }
  }

  private async getFieldOdds(
    input: GetFieldOddsInput,
    page: Page
  ): Promise<GetFieldOddsOutput | null> {
    const { field } = input

    const headers = page.locator(`h2:text-is("${field}")`)
    const headerCount = await headers.count()
    if (headerCount === 0) {
      return null
    }

    const header = headers.nth(0)
    await header.press('Enter')

    const parentDiv = header.locator('..')
    const showMoreSpan = parentDiv.locator('span[class^="ShowMoreText"]')
    await showMoreSpan.dispatchEvent('click')

    const betWrappers = parentDiv.locator(
      'div[class^="MarketExpanderBetWrapper"]'
    )
    const count = await betWrappers.count()

    const odds: Odds[] = []

    for (let i = 0; i < count; i++) {
      const wrapper = betWrappers.nth(i)
      const betName = await wrapper.locator('p').textContent()
      const price = await wrapper.locator('button').textContent()

      if (!betName || !price) {
        continue
      }

      const parts = betName.split(' ')
      const point = parts.pop()
      const type = parts.pop()

      if (!point) {
        continue
      }

      odds.push({
        type: bettingFieldType.parse(type),
        point: parseFloat(point),
        player: parts.join(' '),
        price: fractionToDecimal(price),
      })
    }

    return {
      field,
      odds,
    }
  }
}
