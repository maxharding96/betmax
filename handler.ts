import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { FbRefClient, OddsCheckerClient } from './src/clients'
import { leagueEnum, type League } from './src/types/internal'
import { select } from '@inquirer/prompts'
import pl from 'nodejs-polars'

chromium.use(StealthPlugin())

const browser = await chromium.launch({ headless: true })

const fbRefClient = new FbRefClient(browser)
const oddsCheckerClient = new OddsCheckerClient(browser)

const league = await select<League>({
  message: 'Select a league',
  choices: leagueEnum.options,
})

const { matches } = await oddsCheckerClient.getMatches({
  league,
})

const dfs: pl.DataFrame[] = []

for (const match of matches) {
  try {
    const response = await oddsCheckerClient.getOdds({
      match,
      title: 'Player Shots On Target',
    })
    if (!response) {
      continue
    }

    const { odds } = response
    const df = await getMatchStatsDataframe({ match, odds })

    if (df) dfs.push(df)
  } catch (e) {
    console.log(e)
  }
}
