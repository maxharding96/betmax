import { FbRefClient, OddsCheckerClient } from './src/clients'
import { joinOnPlayer, saveToXlsx } from './src/utils/table'
import pl from 'nodejs-polars'
import {
  leagueEnum,
  type League,
  bettingFieldEnum,
  type BettingField,
  type DateOption,
  dateOptionEnum,
} from './src/types/internal'
import { toFbRefTeam } from './src/utils/fbRef'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { slugify } from './src/utils/common'
import { select, checkbox } from '@inquirer/prompts'
import { getFieldStatsDf } from './src'

chromium.use(StealthPlugin())

const browser = await chromium.launch({ headless: true })

const fbRefClient = new FbRefClient(browser)
const oddsCheckerClient = new OddsCheckerClient(browser)

const dfs: pl.DataFrame[] = []

const league = await select<League>({
  message: 'Which league would you like?',
  choices: leagueEnum.options,
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

const dateOption = await select<DateOption>({
  message: 'Which dates do you want fixtures from?',
  choices: dateOptionEnum.options,
})

const tables = await fbRefClient.getStatTables({
  league,
  season: '2025-2026',
  stat: 'shooting',
})

const { matches } = await oddsCheckerClient.getMatches({
  league,
})

for (const match of matches) {
  try {
    const response = await oddsCheckerClient.getOdds({
      match,
      fields,
      dateOption,
    })

    if (!response) {
      continue
    }

    const { oddsByField } = response

    const fieldDfs: pl.DataFrame[] = []

    for (const { odds, field } of oddsByField) {
      const df = getFieldStatsDf({
        tables,
        homeTeam: toFbRefTeam(match.home),
        awayTeam: toFbRefTeam(match.away),
        odds,
        field,
        points,
      })

      fieldDfs.push(df)
    }

    if (fieldDfs.length) {
      dfs.push(joinOnPlayer(fieldDfs))
    }
  } catch (e) {
    console.log(e)
  }
}

if (dfs.length) {
  saveToXlsx({
    dfs,
    filename: `${slugify(league)}.xlsx`,
  })
}

await browser.close()
