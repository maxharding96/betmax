import pl from 'nodejs-polars'
import type { Tables, Team, StatCol } from '@/types/fbRef'
import type { BettingField, League, OddsMap } from '@/types/internal'
import type { Odds } from '@/types/oddsChecker'
import { getOrCreate } from '@/utils/common'
import {
  bettingFieldToStatCol,
  leagueToLeagueCode,
  readLeagueTeamWeights,
} from '@/utils/fbRef'
import {
  getPointOdds,
  getPointProbabilities,
  getStatHitRate,
  getTeamPlayersDf,
  getWeightedStat,
} from '@/utils/table'
import {
  getKellyCriterion,
  getProbabilityOfOdds,
  oddsOfProbability,
  poissonGreaterOrEqual,
  valueOfOdds,
} from '@/utils/probabilty'
import type { FbRefClient } from '@/clients'

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
  col: StatCol
  weight: number
  map: OddsMap
  names: string[]
  point: number
  lineups: string[] | null
}) {
  // get df of players of team that have played
  const df = getTeamPlayersDf(playerDf, { team, lineups, col })

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
    weight,
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

  const valueCol = pl.Series('EV (%)', valueArray)
  const kcCol = pl.Series('Kelly Criterion (%)', kcArray)

  const filtered = df
    .withColumns(oddsCol, probCol, valueCol, kcCol)
    .filter(pl.col('EV (%)').gtEq(0))
    .filter(pl.col('Kelly Criterion (%)').gtEq(0))

  return filtered
}

export async function getFieldStatsDf({
  league,
  tables,
  homeTeam,
  awayTeam,
  field,
  odds,
  point,
  lineups,
}: {
  league: League
  tables: Tables
  homeTeam: Team
  awayTeam: Team
  field: BettingField
  odds: Odds[]
  point: number
  lineups: string[] | null
}) {
  const map = createOddsMapping(odds)
  const names = getPlayerNames(odds)

  const teamCol = bettingFieldToStatCol(field)

  const weights = readLeagueTeamWeights(league)

  const homeWeight = weights[awayTeam]!.Away[teamCol]

  const awayWeight = weights[homeTeam]!.Home[teamCol]

  const playerCol = bettingFieldToStatCol(field)

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
  const seasonHitRates: string[] = []
  const venueHitRates: string[] = []
  const lastFiveHitRates: string[] = []

  const leagueCode = leagueToLeagueCode(league)
  const stat = bettingFieldToStatCol(field)

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

    const seasonHR = getStatHitRate(logs, { stat, point })
    seasonHitRates.push(seasonHR)

    const venueHR = getStatHitRate(logs, { stat, point, venue })
    venueHitRates.push(venueHR)

    const lastFiveHR = getStatHitRate(logs, { stat, point, limit: 5 })
    lastFiveHitRates.push(lastFiveHR)
  }

  const allHitRateCol = pl.Series('Season Hit rate', seasonHitRates)

  const venueHitRateCol = pl.Series('Venue Hit rate', venueHitRates)

  const lastFiveHitRateCol = pl.Series('Last 5 Hit rate', lastFiveHitRates)

  return df
    .withColumns(allHitRateCol, venueHitRateCol, lastFiveHitRateCol)
    .filter(pl.col('EV (%)').gtEq(0).and(pl.col('Kelly Criterion (%)').gtEq(0)))
}

export async function addWeightedStats({
  client,
  df,
  field,
  point,
  league,
  homeTeam,
  awayTeam,
}: {
  client: FbRefClient
  df: pl.DataFrame
  field: BettingField
  point: number
  league: League
  homeTeam: Team
  awayTeam: Team
}) {
  const weights = readLeagueTeamWeights(league)
  const leagueCode = leagueToLeagueCode(league)
  const stat = bettingFieldToStatCol(field)

  const weightedPredictions = []
  const values = []
  const kcArray: number[] = []
  const venues: string[] = []

  for (const row of df.toRecords()) {
    const playerId = row.ID as string
    const player = row.Player as string
    const squad = row.Squad as Team
    const mps = parseFloat(row['Mn/Start'] as string)
    const odds = parseFloat(row['Odds'] as string)

    const isHome = homeTeam === squad
    const opponent = isHome ? awayTeam : homeTeam

    let logs = playerIdToMatchLogs.get(playerId)

    if (!logs) {
      logs = await client.getPlayerMatchLogs({
        playerId,
        player,
        leagueCode,
      })
    }

    const weightedStat = getWeightedStat(logs, { stat, isHome, mps })

    const weight = weights[opponent]![isHome ? 'Away' : 'Home'][stat]

    const pb = poissonGreaterOrEqual(point, weightedStat, weight)
    const prediction = oddsOfProbability(pb)

    const value = valueOfOdds({ real: odds, predicted: prediction })
    const kellyCriterion = getKellyCriterion(
      odds,
      getProbabilityOfOdds(prediction)
    )

    weightedPredictions.push(prediction)
    values.push(value)
    kcArray.push(kellyCriterion)
    venues.push(isHome ? 'Home' : 'Away')
  }

  const weightedCol = pl.Series('Prediction +', weightedPredictions)
  const valueCol = pl.Series('EV (%)', values)
  const kcCol = pl.Series('Kelly Criterion (%)', kcArray)
  const venueCol = pl.Series('Venue', venues)

  return df.withColumns(venueCol, weightedCol, valueCol, kcCol).filter(
    pl
      .col('EV (%)')
      .gtEq(0)
      .and(
        pl
          .col('Kelly Criterion (%)')
          .gtEq(0)
          .and(pl.col('EV (%)').mul(pl.col('Kelly Criterion (%)')).gtEq(1000))
      )
  )
}
