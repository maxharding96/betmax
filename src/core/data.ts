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
import { getOrCreate, roundToTwo } from '@/utils/common'
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
  getTeamStat,
  sortByValue,
} from '@/utils/table'
import { oddsOfProbability, valueOfOdds } from '@/utils/probabilty'
import { MAX_PROBABILITY, MIN_VALUE } from '@/config/constants'
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

function getStatWeight({
  tables,
  opponent,
  stat,
}: {
  tables: Tables
  opponent: Team
  stat: SquadTableCol
}) {
  const vsOpponent = getTeamStat(tables.vsSquad, {
    stat,
    team: opponent,
    vs: true,
  })

  const mean = getTeamMeanStat(tables.vsSquad, { stat })

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
}: {
  playerDf: pl.DataFrame
  team: Team
  col: PlayerTableCol
  weight: number
  map: OddsMap
  names: string[]
  point: number
}) {
  // get df of players of team that have played
  const df = getTeamPlayersDf(playerDf, { team })

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

  for (let i = 0; i < oddsCol.length; i++) {
    const odd = oddsCol.get(i)
    const prob = probCol.get(i)

    // calculate estimated value
    const value = valueOfOdds({ real: odd, predicted: prob })
    valueArray.push(value)
  }

  const valueCol = pl.Series('EV (%)', valueArray)

  const filtered = df
    .withColumns(oddsCol, probCol, valueCol) // add new columns
    .filter(pl.col('Probability').ltEq(MAX_PROBABILITY)) // filter high probability odds
    .filter(pl.col('EV (%)').gtEq(MIN_VALUE)) // filter low value odds

  return filtered
}

export function getFieldStatsDf({
  tables,
  homeTeam,
  awayTeam,
  field,
  odds,
  point,
}: {
  tables: Tables
  homeTeam: Team
  awayTeam: Team
  field: BettingField
  odds: Odds[]
  point: number
}) {
  const map = createOddsMapping(odds)
  const names = getPlayerNames(odds)

  const teamCol = bettingFieldToTeamCol(field)

  const homeWeight = getStatWeight({
    tables,
    opponent: awayTeam,
    stat: teamCol,
  })

  const awayWeight = getStatWeight({
    tables,
    opponent: homeTeam,
    stat: teamCol,
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
  })

  const awayDf = getTeamFieldStatsDf({
    playerDf: tables.player,
    team: awayTeam,
    col: playerCol,
    weight: awayWeight,
    map,
    names,
    point,
  })

  return sortByValue(pl.concat([homeDf, awayDf]))
}

const playerIdToMatchLogs = new Map<string, pl.DataFrame>()

export async function addPlayerHitRates({
  client,
  df,
  field,
  point,
  league,
}: {
  client: FbRefClient
  df: pl.DataFrame
  field: BettingField
  point: number
  league: League
}) {
  const hitRates: number[] = []
  const odds: number[] = []

  const leagueCode = leagueToLeagueCode(league)
  const stat = bettingFieldToPlayerCol(field)

  for (const row of df.toRecords()) {
    const playerId = row.ID as string
    const player = row.Player as string

    let logs = playerIdToMatchLogs.get(playerId)
    if (!logs) {
      logs = await client.getPlayerMatchLogs({
        playerId,
        player,
        leagueCode,
      })
    }

    const hr = getStatHitRate(logs, { stat, point })

    hitRates.push(roundToTwo(hr) * 100)
    odds.push(oddsOfProbability(hr))
  }

  const hitRateCol = pl.Series('Hit rate (%)', hitRates)
  const oddsCol = pl.Series('HR Odds', odds)

  return df
    .withColumns(hitRateCol, oddsCol)
    .filter(pl.col('Probability').minus(pl.col('HR Odds')).gt(0))
}
