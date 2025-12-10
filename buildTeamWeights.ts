import { FbRefClient } from './src/clients'
import { getTeamAvgAgainstShootingStats } from './src/utils/table'
import type { LeagueTeamWeights, Team } from './src/types/fbRef'
import { getBrowser } from '@/core/web'
import { selectLeague } from '@/core/input'
import { writeFileSync } from 'fs'
import { getLeagueTeamWeightsPath } from '@/utils/fbRef'

const browser = await getBrowser({ headless: true })

const fbRefClient = new FbRefClient(browser)

const league = await selectLeague()

//TODO lazy reusing type
const allStats: LeagueTeamWeights = {}

let sotHomeMeanSum = 0
let sotAwayMeanSum = 0
let shHomeMeanSum = 0
let shAwayMeanSum = 0

const { squad } = await fbRefClient.getStatTables({
  league,
  stat: 'shooting',
})

const squadCount = squad.height

for (const row of squad.toRecords()) {
  const teamId = row.ID as string
  const team = row.Squad as Team

  const logs = await fbRefClient.getTeamMatchStatLogs({
    league,
    stat: 'shooting',
    team,
    teamId,
  })

  const stats = getTeamAvgAgainstShootingStats(logs.against)
  allStats[team] = stats

  sotHomeMeanSum += stats.Home.SoT
  shHomeMeanSum += stats.Home.Sh
  sotAwayMeanSum += stats.Away.SoT
  shAwayMeanSum += stats.Away.Sh
}

const sotHomeMean = sotHomeMeanSum / squadCount
const shHomeMean = shHomeMeanSum / squadCount
const sotAwayMean = sotAwayMeanSum / squadCount
const shAwayMean = shAwayMeanSum / squadCount

const weights: LeagueTeamWeights = Object.fromEntries(
  Object.entries(allStats).map(([k, v]) => [
    k,
    {
      Home: {
        SoT: v.Home.SoT / sotHomeMean,
        Sh: v.Home.Sh / shHomeMean,
      },
      Away: {
        SoT: v.Away.SoT / sotAwayMean,
        Sh: v.Away.Sh / shAwayMean,
      },
    },
  ])
)

const json = JSON.stringify(weights, null, 2)
const path = getLeagueTeamWeightsPath(league)

writeFileSync(path, json)

await browser.close()
