import type {
  GetStatTablesInput,
  Tables,
  Table,
  Stat,
  LeagueCode,
  Team,
} from '../types/fbRef'
import { type Browser } from 'playwright'
import pl from 'nodejs-polars'
import {
  getColumns,
  getPlayerStatMatchLogsPath,
  getTableId,
  getTeamMatchStatPath,
  leagueToStatPath,
} from '../utils/fbRef'
import { Scraper } from './scraper'
import type { League } from '@/types/internal'
import { join } from '@/utils/table'

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
    leagueCode,
  }: {
    playerId: string
    player: string
    leagueCode: LeagueCode
  }): Promise<pl.DataFrame> {
    await this.rateLimiter.consume()

    const page = await this.getPage()

    const url =
      this.baseUrl +
      getPlayerStatMatchLogsPath({ playerId, player, leagueCode })

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const logs = await this.getTable({
      tableId: `matchlogs_2025-2026_${leagueCode}`,
    })

    return logs
  }

  async getTeamMatchStatLogs({
    league,
    team,
    teamId,
    stat,
  }: {
    league: League
    team: Team
    teamId: string
    stat: Stat
  }) {
    await this.rateLimiter.consume()

    const page = await this.getPage()

    const url =
      this.baseUrl + getTeamMatchStatPath({ league, team, teamId, stat })

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const forLogs = await this.getTable({
      tableId: 'matchlogs_for',
    })

    const againstLogs = await this.getTable({
      tableId: 'matchlogs_against',
    })

    return { for: forLogs, against: againstLogs }
  }

  async getBasePlayerTable({
    league,
  }: {
    league: League
  }): Promise<pl.DataFrame> {
    const { player: playerStandard } = await this.getStatTables({
      league,
      stat: 'standard',
    })

    const { player: playerPlayingTime } = await this.getStatTables({
      league,
      stat: 'playingtime',
    })

    return join([playerStandard, playerPlayingTime])
  }

  async getStatTables(input: GetStatTablesInput): Promise<Tables> {
    const { league, stat } = input

    await this.rateLimiter.consume()

    const page = await this.getPage()
    const url = this.baseUrl + leagueToStatPath({ league, stat })

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const player = await this.getStatsTable({
      table: 'player',
      stat,
      parseId: 'player',
    })

    const squad = await this.getStatsTable({
      table: 'squad',
      stat,
      parseId: 'team',
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
    parseId,
  }: {
    tableId: string
    parseId?: string
  }) {
    if (!this.page) {
      throw Error('Tried to get table before page was loaded')
    }

    const loc = this.page.locator(`table#${tableId}`)
    const tb = loc.nth(0)

    const data = await tb.evaluate((t, parseId) => {
      const rows = Array.from(t.querySelectorAll('tr'))

      return Promise.all(
        rows.map(async (row) => {
          const cells = Array.from(row.querySelectorAll('th, td'))

          const contents = await Promise.all(
            cells.map(async (cell) => {
              const contents: string[] = []

              const dataStat = cell.getAttribute('data-stat')

              if (parseId && dataStat === parseId) {
                if (cell.children.length) {
                  const a = cell.children[0]
                  const href = a.getAttribute('href')
                  if (!href) {
                    throw Error('No href found on <a> tag')
                  }

                  const id = href.split('/')[3]
                  contents.push(id)
                } else {
                  contents.push('ID')
                }
              }

              contents.push(cell.textContent ? cell.textContent.trim() : '')

              return contents
            })
          )

          return contents.flat()
        })
      )
    }, parseId)

    const [_, headers, ...rows] = data

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
    parseId,
  }: {
    table: Table
    stat: Stat
    parseId?: string
  }) {
    const tableId = getTableId({ table, stat })

    const df = await this.getTable({ tableId, parseId })

    return df.select(...getColumns({ table, stat }))
  }
}
