import pl from 'nodejs-polars'
import type {
  GetStatTablesOutput,
  PlayerTableCol,
  SquadTableCol,
  Team,
} from './types/fbRef'
import type { BettingField, League, OddsMap } from './types/internal'
import type { Odds } from './types/oddsChecker'
import { getOrCreate } from './utils/common'
import { bettingFieldToPlayerCol, bettingFieldToTeamCol } from './utils/fbRef'
import {
  getPointOdds,
  getPointProbabilities,
  getTeamMeanStat,
  getTeamPlayersDf,
  getTeamStat,
} from './utils/table'

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
  tables: GetStatTablesOutput
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
  points,
}: {
  tables: GetStatTablesOutput
  homeTeam: Team
  awayTeam: Team
  field: BettingField
  odds: Odds[]
  points: number[]
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
    points,
  })

  const awayDf = getTeamFieldStatsDf({
    playerDf: tables.player,
    team: awayTeam,
    col: playerCol,
    weight: awayWeight,
    map,
    names,
    points,
  })

  return pl.concat([homeDf, awayDf]).sort('Player')
}

function getTeamFieldStatsDf({
  playerDf,
  team,
  col,
  weight,
  map,
  names,
  points,
}: {
  playerDf: pl.DataFrame
  team: Team
  col: PlayerTableCol
  weight: number
  map: OddsMap
  names: string[]
  points: number[]
}) {
  const df = getTeamPlayersDf(playerDf, { team })

  const cols = points
    .flatMap((point) => {
      const oddsCol = getPointOdds(df, {
        point,
        col,
        map,
        names,
      })

      if (!oddsCol) return

      const probCol = getPointProbabilities(df, {
        point,
        col,
        weight: weight,
      })

      return [probCol, oddsCol]
    })
    .filter((res) => !!res)

  return df.withColumns(...cols)
}
