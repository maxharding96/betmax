import { FbRefClient, OddsCheckerClient } from './src/clients'
import { join, saveToXlsx, stack } from './src/utils/table'
import pl from 'nodejs-polars'
import { bettingFieldToStat, toFbRefTeam } from './src/utils/fbRef'
import { addPlayerHitRates, getFieldStatsDf } from '@/core/data'
import type { Stat, Tables } from './src/types/fbRef'
import chalk from 'chalk'
import { appendOrCreate } from './src/utils/common'
import { getBrowser } from '@/core/web'
import {
  selectFields,
  selectFixtures,
  selectLeague,
  selectPoints,
} from '@/core/input'
import { createFixtureToMatchMap } from '@/utils/oddsChecker'

// Cache
const statToTables = new Map<Stat, Tables>()
const fieldToDfs = new Map<string, pl.DataFrame[]>()

// Load browser
const browser = await getBrowser({ headless: true })

// Scrape clients
const oddsCheckerClient = new OddsCheckerClient(browser)
const fbRefClient = new FbRefClient(browser)

// Select inputs
const league = await selectLeague()

console.log(chalk.green.bold('⚽ Fetching matches...'))

const { matches } = await oddsCheckerClient.getMatches({
  league,
})

if (!matches.length) {
  console.log(
    chalk.green.red(
      '❌ No matches currently found for these league. Try again later.'
    )
  )
}

const fixtureToMatch = createFixtureToMatchMap(matches)

const fixtures = await selectFixtures([...fixtureToMatch.keys()])
const fields = await selectFields()
const points = await selectPoints()

const basePlayerTable = await fbRefClient.getBasePlayerTable({ league })

for (const fixture of fixtures) {
  console.log(chalk.blue.bold(`🧮 Calculating odds for ${fixture}...`))

  const match = fixtureToMatch.get(fixture)
  if (!match) {
    continue
  }
  const response = await oddsCheckerClient.getOdds({
    match,
    fields,
  })

  if (!response) {
    continue
  }
  const { oddsByField } = response

  for (const { odds, field } of oddsByField) {
    const stat = bettingFieldToStat(field)
    let tables = statToTables.get(stat)

    if (!tables) {
      const { player, ...rest } = await fbRefClient.getStatTables({
        league,
        stat,
      })

      tables = {
        ...rest,
        player: join([basePlayerTable, player]),
      }

      statToTables.set(stat, tables)
    }

    for (const point of points) {
      let df = getFieldStatsDf({
        tables,
        homeTeam: toFbRefTeam(match.home),
        awayTeam: toFbRefTeam(match.away),
        odds,
        field,
        point,
      })

      df = await addPlayerHitRates({
        client: fbRefClient,
        df,
        field,
        point,
        league,
      })

      appendOrCreate(fieldToDfs, `${field} > ${point}`, df)
    }
  }
}

console.log(chalk.red.bold('📊 Generating your spreadsheet...'))

if (fieldToDfs.size) {
  const entries: Array<[string, pl.DataFrame]> = []

  for (const [field, dfs] of fieldToDfs) {
    const df = stack(dfs)

    if (df.height === 0) {
      continue
    }

    entries.push([field, df])
  }

  if (entries.length) {
    saveToXlsx(entries)
  }
}

await browser.close()
