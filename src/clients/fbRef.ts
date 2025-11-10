import type { GetStatTablesInput, Tables, Table, Stat } from '../types/fbRef'
import { type Browser } from 'playwright'
import pl from 'nodejs-polars'
import {
  getColumns,
  getPlayerStatMatchLogsPath,
  getTableId,
  leagueToStatPath,
} from '../utils/fbRef'
import { Scraper } from './scraper'

export class FbRefClient extends Scraper {
  constructor(browser: Browser) {
    super({
      baseUrl: 'https://fbref.com/en',
      browser,
    })
  }

  async getPlayerMatchLogs({
    playerId,
    player,
  }: {
    playerId: string
    player: string
  }): Promise<pl.DataFrame> {
    const page = await this.getPage()

    const url = this.baseUrl + getPlayerStatMatchLogsPath({ playerId, player })
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const logs = await this.getTable({
      tableId: 'matchlogs_2025-2026_9',
    })

    return logs
  }

  async getStatTables(input: GetStatTablesInput): Promise<Tables> {
    const { league, stat } = input

    const page = await this.getPage()
    const url = this.baseUrl + leagueToStatPath({ league, stat })
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const player = await this.getStatsTable({
      table: 'player',
      stat,
      idCol: 'player',
    })

    const squad = await this.getStatsTable({
      table: 'squad',
      stat,
    })

    const vsSquad = await this.getStatsTable({
      table: 'vsSquad',
      stat,
    })

    return {
      player,
      squad,
      vsSquad,
    }
  }

  private async getTable({
    tableId,
    idCol,
  }: {
    tableId: string
    idCol?: string
  }) {
    if (!this.page) {
      throw Error('Tried to get table before page was loaded')
    }

    const loc = this.page.locator(`table#${tableId}`)
    const tb = loc.nth(0)

    const data = await tb.evaluate((t, idColValue) => {
      const rows = Array.from(t.querySelectorAll('tr'))

      return Promise.all(
        rows.map(async (row) => {
          const cells = Array.from(row.querySelectorAll('th, td'))
          let currentId: string | null = null

          const contents = await Promise.all(
            cells.map(async (cell) => {
              if (idColValue) {
                const stat = cell.getAttribute('data-stat')
                if (stat === idColValue) {
                  currentId = cell.getAttribute('data-append-csv')
                }
              }

              return cell.textContent ? cell.textContent.trim() : ''
            })
          )

          if (currentId) {
            contents.unshift(currentId)
          }

          return contents
        })
      )
    }, idCol)

    const headers = data[1]
    if (idCol) {
      headers.unshift('ID')
    }

    const rows = data.slice(2)

    const arrayOfObjects: Record<string, string>[] = rows.map((row) => {
      const obj: Record<string, string> = {}
      headers.forEach((key, i) => {
        obj[key] = row[i]
      })
      return obj
    })

    return pl.DataFrame(arrayOfObjects)
  }

  private async getStatsTable({
    table,
    stat,
    idCol,
  }: {
    table: Table
    stat: Stat
    idCol?: string
  }) {
    const tableId = getTableId({ table, stat })

    const df = await this.getTable({ tableId, idCol })

    return df.select(...getColumns({ table, stat }))
  }
}
