import type { GetStatTablesInput, GetStatTablesOutput } from '../types/fbRef'
import { type Browser } from 'playwright'
import pl from 'nodejs-polars'
import { leagueToStatPath } from '../utils/fbRef'
import { Scraper } from './scraper'

export class FbRefClient extends Scraper {
  constructor(browser: Browser) {
    super({
      baseUrl: 'https://fbref.com/en',
      browser,
    })
  }

  async getStatTables(input: GetStatTablesInput): Promise<GetStatTablesOutput> {
    const { league, stat } = input

    const url = this.baseUrl + leagueToStatPath({ league, stat })

    const page = await this.getPage()
    await page.goto(url, { waitUntil: 'networkidle' })

    const showTableButton = page.locator(
      `button:has-text("Show Player Shooting")`
    )
    const showTableButtonCount = await showTableButton.count()
    if (showTableButtonCount === 1) {
      await showTableButton.press('Enter')
    }

    const showHiddenButton = page.locator(`button:has-text("Show hidden rows")`)
    const showHiddenButtonCount = await showHiddenButton.count()
    if (showHiddenButtonCount === 1) {
      await showHiddenButton.press('Enter')
    }

    const locators = page.locator('table')
    const count = await locators.count()

    const tableData = []

    for (let i = count - 3; i <= count; i++) {
      const table = locators.nth(i - 1)

      const data = await table.evaluate((t) => {
        const rows = Array.from(t.querySelectorAll('tr'))
        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll('th, td'))
          return cells.map((cell) =>
            cell.textContent ? cell.textContent.trim() : ''
          )
        })
      })

      tableData.push(data)
    }

    const dfs = []

    for (const td of tableData) {
      const header = td[1]
      const rows = td.slice(2)

      const arrayOfObjects: Record<string, string>[] = rows.map((row) => {
        const obj: Record<string, string> = {}
        header.forEach((key, i) => {
          obj[key] = row[i]
        })
        return obj
      })

      const df = pl.DataFrame(arrayOfObjects)
      dfs.push(df)
    }

    const playerTable = dfs.pop()
    if (!playerTable) {
      throw new Error('Player table not found')
    }

    const vsSquadTable = dfs.pop()
    if (!vsSquadTable) {
      throw new Error('vsSquad table not found')
    }

    const squadTable = dfs.pop()
    if (!squadTable) {
      throw new Error('Squad table not found')
    }

    return {
      squad: squadTable,
      vsSquad: vsSquadTable,
      player: playerTable,
    }
  }
}
