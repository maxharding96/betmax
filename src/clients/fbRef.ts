import type { GetStatTablesInput, Tables, Table, Stat } from '../types/fbRef'
import { type Browser } from 'playwright'
import pl from 'nodejs-polars'
import { getColumns, getTableId, leagueToStatPath } from '../utils/fbRef'
import { Scraper } from './scraper'

export class FbRefClient extends Scraper {
  constructor(browser: Browser) {
    super({
      baseUrl: 'https://fbref.com/en',
      browser,
    })
  }

  async getStatTables(input: GetStatTablesInput): Promise<Tables> {
    const { league, stat } = input

    const page = await this.getPage()
    const url = this.baseUrl + leagueToStatPath({ league, stat })
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const player = await this.getTable({
      table: 'player',
      stat,
    })

    const squad = await this.getTable({
      table: 'squad',
      stat,
    })

    const vsSquad = await this.getTable({
      table: 'vsSquad',
      stat,
    })

    return {
      player,
      squad,
      vsSquad,
    }
  }

  private async getTable({ table, stat }: { table: Table; stat: Stat }) {
    if (!this.page) {
      throw Error('Tried to get table before page was loaded')
    }

    const id = getTableId({ table, stat })
    const loc = this.page.locator(`table#${id}`)
    const tb = loc.nth(0)

    const data = await tb.evaluate((t) => {
      const rows = Array.from(t.querySelectorAll('tr'))
      return rows.map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        return cells.map((cell) =>
          cell.textContent ? cell.textContent.trim() : ''
        )
      })
    })

    const header = data[1]
    const rows = data.slice(2)

    const arrayOfObjects: Record<string, string>[] = rows.map((row) => {
      const obj: Record<string, string> = {}
      header.forEach((key, i) => {
        obj[key] = row[i]
      })
      return obj
    })

    const df = pl.DataFrame(arrayOfObjects)

    return df.select(...getColumns({ table, stat }))
  }
}
