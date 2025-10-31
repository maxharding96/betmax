import pl from 'nodejs-polars'
import type {
  Tables,
  PlayerTableCol,
  SquadTableCol,
  Team,
  Stat,
} from './types/fbRef'
import type { BettingField, OddsMap } from './types/internal'
import type { Odds } from './types/oddsChecker'
import { getOrCreate } from './utils/common'
import { bettingFieldToPlayerCol, bettingFieldToTeamCol } from './utils/fbRef'
import {
  addEstGameTimeIfStarting,
  getPointOdds,
  getPointProbabilities,
  getTeamMeanStat,
  getTeamPlayersDf,
  getTeamStat,
} from './utils/table'
import { valueOfOdds } from './utils/probabilty'
import { MAX_PROBABILITY, MIN_VALUE } from './constants'

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

  return pl.concat([homeDf, awayDf])
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
  let df = getTeamPlayersDf(playerDf, { team })
  df = addEstGameTimeIfStarting(df)

  const rowsToKeep: number[] = []

  const oddsCol = getPointOdds(df, {
    point,
    map,
    names,
  })

  // Return empty dataframe
  if (!oddsCol) return pl.DataFrame()

  const probCol = getPointProbabilities(df, {
    point,
    col,
    weight: weight,
  })

  const valueArray: number[] = []

  for (let i = 0; i < oddsCol.length; i++) {
    const odd = oddsCol.get(i)
    const prob = probCol.get(i)

    const value = valueOfOdds({ real: odd, predicted: prob })
    valueArray.push(value)

    if (odd && prob && prob <= MAX_PROBABILITY && value >= MIN_VALUE) {
      rowsToKeep.push(i)
    }
  }

  const valueCol = pl.Series('Value (%)', valueArray)

  return df
    .withColumns(oddsCol, probCol, valueCol)
    .withRowCount('row_nr')
    .filter(pl.col('row_nr').isIn(rowsToKeep))
    .drop('row_nr')
}
