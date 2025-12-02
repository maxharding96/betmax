import pl from 'nodejs-polars'
import type {
  Tables,
  PlayerTableCol,
  SquadTableCol,
  Team,
  Stat,
} from '@/types/fbRef'
import type { BettingField, League, OddsMap } from '@/types/internal'
import type { Odds } from '@/types/oddsChecker'
import { getOrCreate, zip } from '@/utils/common'
import {
  bettingFieldToPlayerCol,
  bettingFieldToTeamCol,
  leagueToLeagueCode,
} from '@/utils/fbRef'
import {
  getPointOdds,
  getPointProbabilities,
  getStatHitRate,
  getTeamMeanStat,
  getTeamPlayersDf,
  getTeamVenueStat,
} from '@/utils/table'
import {
  getKellyCriterion,
  getProbabilityOfOdds,
  valueOfOdds,
} from '@/utils/probabilty'
import { MIN_VALUE } from '@/config/constants'
import type { FbRefClient } from '@/clients'

let teamToIdMap: Map<Team, string> | null = null

function createTeamToIdMap(df: pl.DataFrame) {
  if (teamToIdMap) {
    return teamToIdMap
  }

  teamToIdMap = new Map<Team, string>()

  for (const row of df.toRecords()) {
    const team = row.Squad as Team
    const id = row.ID as string

    teamToIdMap.set(team, id)
  }

  return teamToIdMap
}

function createOddsMapping(odds: Odds[]): OddsMap {
  const mapping: OddsMap = new Map()

  for (const o of odds) {
    const fieldPointMapping = getOrCreate(mapping, o.point, () => new Map())
    const playerMapping = getOrCreate(
      fieldPointMapping,
      o.player,
      () => new Map()
    )

    playerMapping.set(o.type, o.price)
  }

  return mapping
}

function getPlayerNames(odds: Odds[]): string[] {
  const names = new Set<string>()

  for (const o of odds) {
    names.add(o.player)
  }

  return [...names]
}

const teamIdToMatchLogs = new Map<
  string,
  { for: pl.DataFrame; against: pl.DataFrame }
>()

async function getStatWeight({
  client,
  league,
  tables,
  opponent,
  opponentId,
  statCol,
  stat,
  venue,
}: {
  client: FbRefClient
  league: League
  tables: Tables
  opponent: Team
  opponentId: string
  statCol: SquadTableCol
  stat: Stat
  venue: 'Home' | 'Away'
}) {
  let matchLogs = teamIdToMatchLogs.get(opponentId)

  if (!matchLogs) {
    matchLogs = await client.getTeamMatchStatLogs({
      league,
      stat,
      team: opponent,
      teamId: opponentId,
    })
  }

  const vsOpponent = getTeamVenueStat(matchLogs.against, {
    stat: statCol,
    venue,
  })

  const mean = getTeamMeanStat(tables.vsSquad, { stat: statCol })

  return vsOpponent / mean
}

function getTeamFieldStatsDf({
  playerDf,
  team,
  col,
  weight,
  map,
  names,
  point,
  lineups,
}: {
  playerDf: pl.DataFrame
  team: Team
  col: PlayerTableCol
  weight: number
  map: OddsMap
  names: string[]
  point: number
  lineups: string[] | null
}) {
  // get df of players of team that have played
  const df = getTeamPlayersDf(playerDf, { team, lineups })

  // get best odds for each player
  const oddsCol = getPointOdds(df, {
    point,
    map,
    names,
  })

  // return empty dataframe if no odds found
  if (!oddsCol) return pl.DataFrame()

  // calculate probabilty
  const probCol = getPointProbabilities(df, {
    point,
    col,
    weight: weight,
  })

  const valueArray: number[] = []
  const kcArray: number[] = []

  for (let i = 0; i < oddsCol.length; i++) {
    const odd = oddsCol.get(i)
    const prob = probCol.get(i)

    // calculate estimated value
    const value = valueOfOdds({ real: odd, predicted: prob })
    valueArray.push(value)

    const kellyCriterion = getKellyCriterion(odd, getProbabilityOfOdds(prob))
    kcArray.push(kellyCriterion)
  }

  const valueCol = pl.Series('P EV (%)', valueArray)
  const kcCol = pl.Series('Kelly Criterion (%)', kcArray)

  const filtered = df
    .withColumns(oddsCol, probCol, valueCol, kcCol) // add new columns
    .filter(pl.col('P EV (%)').gtEq(MIN_VALUE)) // filter low value odds
    .filter(pl.col('Kelly Criterion (%)').gtEq(MIN_VALUE)) // filter low value odds

  return filtered
}

export async function getFieldStatsDf({
  client,
  league,
  tables,
  homeTeam,
  awayTeam,
  stat,
  field,
  odds,
  point,
  lineups,
}: {
  client: FbRefClient
  league: League
  tables: Tables
  homeTeam: Team
  awayTeam: Team
  stat: Stat
  field: BettingField
  odds: Odds[]
  point: number
  lineups: string[] | null
}) {
  const map = createOddsMapping(odds)
  const names = getPlayerNames(odds)

  const teamCol = bettingFieldToTeamCol(field)

  const teamToIdMap = createTeamToIdMap(tables.squad)

  const homeWeight = await getStatWeight({
    client,
    league,
    tables,
    opponent: awayTeam,
    opponentId: teamToIdMap.get(awayTeam)!,
    stat,
    statCol: teamCol,
    venue: 'Home',
  })

  const awayWeight = await getStatWeight({
    client,
    league,
    tables,
    opponent: homeTeam,
    opponentId: teamToIdMap.get(homeTeam)!,
    stat,
    statCol: teamCol,
    venue: 'Away',
  })

  const playerCol = bettingFieldToPlayerCol(field)

  const homeDf = getTeamFieldStatsDf({
    playerDf: tables.player,
    team: homeTeam,
    col: playerCol,
    weight: homeWeight,
    map,
    names,
    point,
    lineups,
  })

  const awayDf = getTeamFieldStatsDf({
    playerDf: tables.player,
    team: awayTeam,
    col: playerCol,
    weight: awayWeight,
    map,
    names,
    point,
    lineups,
  })

  return pl.concat([homeDf, awayDf])
}

const playerIdToMatchLogs = new Map<string, pl.DataFrame>()

export async function addPlayerHitRates({
  client,
  df,
  field,
  point,
  league,
  homeTeam,
}: {
  client: FbRefClient
  df: pl.DataFrame
  field: BettingField
  point: number
  league: League
  homeTeam: Team
}) {
  const allHitRates: number[] = []
  const venueHitRates: number[] = []
  const lastFiveHitRates: number[] = []

  const leagueCode = leagueToLeagueCode(league)
  const stat = bettingFieldToPlayerCol(field)

  for (const row of df.toRecords()) {
    const playerId = row.ID as string
    const player = row.Player as string
    const squad = row.Squad as Team

    const venue = homeTeam === squad ? 'Home' : 'Away'

    let logs = playerIdToMatchLogs.get(playerId)
    if (!logs) {
      logs = await client.getPlayerMatchLogs({
        playerId,
        player,
        leagueCode,
      })
    }

    const allHR = getStatHitRate(logs, { stat, point })
    allHitRates.push(allHR * 100)

    const venueHR = getStatHitRate(logs, { stat, point, venue })
    venueHitRates.push(venueHR * 100)

    const lastFiveHR = getStatHitRate(logs, { stat, point, limit: 5 })
    lastFiveHitRates.push(lastFiveHR * 100)
  }

  const odds = df.getColumn('Odds').cast(pl.Float32).toArray()

  const allHitRateCol = pl.Series('Hit rate (%)', allHitRates)
  // const allValueCol = pl.Series(
  //   'HR EV (%)',
  //   zip(odds, allHitRates).map(([o, hr]) =>
  //     valueOfOdds({ real: o, predicted: oddsOfProbability(hr) })
  //   )
  // )

  const venueHitRateCol = pl.Series('Venue Hit rate (%)', venueHitRates)
  // const venueValueCol = pl.Series(
  //   'Venue HR EV (%)',
  //   zip(odds, venueHitRates).map(([o, hr]) =>
  //     valueOfOdds({ real: o, predicted: oddsOfProbability(hr) })
  //   )
  // )

  const lastFiveHitRateCol = pl.Series('Last 5 Hit rate (%)', lastFiveHitRates)
  // const lastFiveValueCol = pl.Series(
  //   'Last 5 HR EV (%)',
  //   zip(odds, lastFiveHitRates).map(([o, hr]) =>
  //     valueOfOdds({ real: o, predicted: oddsOfProbability(hr) })
  //   )
  // )

  return df.withColumns(
    allHitRateCol,
    // allValueCol,
    venueHitRateCol,
    // venueValueCol,
    lastFiveHitRateCol
    // lastFiveValueCol
  )
  // .filter(pl.col('HR EV (%)').gtEq(0))
  // .filter(pl.col('Venue HR EV (%)').gtEq(0))
  // .filter(pl.col('Last 5 HR EV (%)').gtEq(0))
}
