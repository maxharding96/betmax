import { FbRefClient } from './src/clients'
import { getTeamShootingStats } from './src/utils/table'
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

let sotHomeTotal = 0
let sotAwayTotal = 0
let shHomeTotal = 0
let shAwayTotal = 0

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

  const stats = getTeamShootingStats(logs.against)
  allStats[team] = stats

  sotHomeTotal += stats.Home.SoT
  sotAwayTotal += stats.Away.SoT
  shHomeTotal += stats.Home.Sh
  shAwayTotal += stats.Away.Sh
}

const weights: LeagueTeamWeights = Object.fromEntries(
  Object.entries(allStats).map(([k, v]) => [
    k,
    {
      Home: {
        SoT: (v.Home.SoT * squadCount) / sotHomeTotal,
        Sh: (v.Home.Sh * squadCount) / shHomeTotal,
      },
      Away: {
        SoT: (v.Away.SoT * squadCount) / sotAwayTotal,
        Sh: (v.Away.Sh * squadCount) / shAwayTotal,
      },
    },
  ])
)

const json = JSON.stringify(weights, null, 2)
const path = getLeagueTeamWeightsPath(league)

writeFileSync(path, json)

await browser.close()
