import type {
  GetStatTablesInput,
  Tables,
  GetPlayerPlayedTableInput,
} from '../types/fbRef'
import { type Browser } from 'playwright'
import pl from 'nodejs-polars'
import { getColumns, leagueToStatPath } from '../utils/fbRef'
import { Scraper } from './scraper'
import { join } from '../utils/table'

export class FbRefClient extends Scraper {
  constructor(browser: Browser) {
    super({
      baseUrl: 'https://fbref.com/en',
      browser,
    })
  }

  async getPlayerPlayedTable(
    input: GetPlayerPlayedTableInput
  ): Promise<pl.DataFrame> {
    const { league } = input

    const url = this.baseUrl + leagueToStatPath({ league, stat: 'standard' })

    const dfs = await this.getTables(url)

    const table = dfs.pop()
    if (!table) {
      throw new Error('Player table not found')
    }
    return table.select(...getColumns({ table: 'player', stat: 'standard' }))
  }

  async getStatTables(input: GetStatTablesInput): Promise<Tables> {
    const { league, stat, playerPlayedTable } = input

    const url = this.baseUrl + leagueToStatPath({ league, stat })

    const dfs = await this.getTables(url)

    let playerTable = dfs.pop()

    if (!playerTable) {
      throw new Error('Player table not found')
    }

    playerTable = playerTable.select(...getColumns({ table: 'player', stat }))
    playerTable = join([playerPlayedTable, playerTable])

    let vsSquadTable = dfs.pop()
    if (!vsSquadTable) {
      throw new Error('vsSquad table not found')
    }
    vsSquadTable.select(...getColumns({ table: 'vsSquad', stat }))

    let squadTable = dfs.pop()
    if (!squadTable) {
      throw new Error('Squad table not found')
    }
    squadTable.select(...getColumns({ table: 'squad', stat }))

    return {
      squad: squadTable,
      vsSquad: vsSquadTable,
      player: playerTable,
    }
  }

  private async getTables(url: string) {
    const page = await this.getPage()
    await page.goto(url, { waitUntil: 'networkidle' })

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

    return dfs
  }
}
