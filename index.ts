import { FbRefClient, OddsCheckerClient } from './src/clients'
import { saveToXlsx, stack } from './src/utils/table'
import pl from 'nodejs-polars'
import {
  leagueEnum,
  type League,
  bettingFieldEnum,
  type BettingField,
} from './src/types/internal'
import { bettingFieldToStat, toFbRefTeam } from './src/utils/fbRef'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { select, checkbox } from '@inquirer/prompts'
import { getFieldStatsDf } from './src'
import type { Stat, Tables } from './src/types/fbRef'
import type { Match } from './src/types/oddsChecker'
import chalk from 'chalk'
import { appendOrCreate } from './src/utils/common'

chromium.use(StealthPlugin())

const browser = await chromium.launch({ headless: true })

const fbRefClient = new FbRefClient(browser)
const oddsCheckerClient = new OddsCheckerClient(browser)

const league = await select<League>({
  message: 'Which league would you like?',
  choices: leagueEnum.options,
})

console.log(chalk.green.bold('⚽ Fetching matches...'))

const { matches } = await oddsCheckerClient.getMatches({
  league,
})

const fixtureToMatch = new Map<string, Match>()

if (!matches.length) {
  console.log(
    chalk.green.red(
      '❌ No matches currently found for these league. Try again later.'
    )
  )
}

for (const match of matches) {
  const fixture = `${match.home} vs. ${match.away}`
  fixtureToMatch.set(fixture, match)
}

const fixtures = await checkbox<string>({
  message: 'Which matches do you want to look at?',
  choices: [...fixtureToMatch.keys()],
  required: true,
})

const fields = await checkbox<BettingField>({
  message: 'Which betting fields do you want?',
  choices: bettingFieldEnum.options,
  required: true,
})

const points = await checkbox<string>({
  message: 'Which points do you want to consider?',
  choices: ['0.5', '1.5', '2.5'],
  required: true,
}).then((ps) => ps.map(parseFloat))

const statToTables = new Map<Stat, Tables>()
const fieldToDfs = new Map<string, pl.DataFrame[]>()

const playerPlayedTable = await fbRefClient.getPlayerPlayedTable({ league })

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
      tables = await fbRefClient.getStatTables({
        league,
        stat,
        playerPlayedTable,
      })

      statToTables.set(stat, tables)
    }

    for (const point of points) {
      const df = getFieldStatsDf({
        tables,
        homeTeam: toFbRefTeam(match.home),
        awayTeam: toFbRefTeam(match.away),
        odds,
        field,
        point,
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
    if (dfs.length === 0) {
      continue
    }

    entries.push([field, df])
  }

  saveToXlsx(entries)
}

await browser.close()
