import pl from 'nodejs-polars'
import xlsx from 'xlsx'
import type { SquadTableCol, PlayerTableCol, Team, Stat } from '../types/fbRef'
import {
  estGamePlayedWhenStarting,
  oddsOfProbability,
  poissonGreaterOrEqual,
} from './probabilty'
import { findBestPlayerMatch } from './common'
import type { OddsMap } from '../types/internal'

// Player must have played at least 3 games
const MIN_GAMES = 3

export function getTeamStat(
  df: pl.DataFrame,
  {
    team,
    stat,
    vs,
  }: {
    team: Team
    stat: SquadTableCol
    vs: boolean
  }
) {
  const teamStr = vs ? `vs ${team}` : team

  return df
    .filter(pl.col('Squad').str.contains(teamStr))
    .select(
      pl
        .col(stat)
        .cast(pl.Float32)
        .div(pl.col('90s').cast(pl.Float32))
        .alias('result')
    )
    .getColumn('result')
    .get(0)
}

export function getTeamMeanStat(
  df: pl.DataFrame,
  {
    stat,
  }: {
    stat: SquadTableCol
  }
) {
  return df
    .select(
      pl
        .col(stat)
        .cast(pl.Float32)
        .div(pl.col('90s').cast(pl.Float32))
        .mean()
        .alias('result')
    )
    .getColumn('result')
    .get(0)
}

export function getTeamPlayersDf(
  df: pl.DataFrame,
  {
    team,
  }: {
    team: Team
  }
) {
  return df.filter(
    pl
      .col('Squad')
      .str.contains(team)
      .and(pl.col('MP').cast(pl.Float32).gtEq(MIN_GAMES))
  )
}

export function getPointProbabilities(
  df: pl.DataFrame,
  {
    point,
    col,
    weight,
  }: {
    point: number
    col: PlayerTableCol
    weight: number
  }
) {
  const stats = df
    .getColumn(col)
    .cast(pl.Float32)
    .div(df.getColumn('90s').cast(pl.Float32))
    .mul(df.getColumn('Est. play time'))
    .toArray()

  const probs: (number | null)[] = []

  stats.forEach((stat) => {
    if (stat === 0) {
      probs.push(null)
    } else {
      const pb = poissonGreaterOrEqual(point, stat, weight)
      probs.push(oddsOfProbability(pb))
    }
  })

  return pl.Series(`Prob ${col} > ${point}`, probs)
}

export function addEstGameTimeIfStarting(df: pl.DataFrame) {
  const estimates: number[] = []

  const records = df.toRecords()
  for (const row of records) {
    const matchesPlayed = parseFloat(String(row['MP']))
    const minutesPlayed = parseFloat(String(row['Min']))
    const starts = parseFloat(String(row['Starts']))

    const est = estGamePlayedWhenStarting({
      matchesPlayed,
      minutesPlayed,
      starts,
    })

    estimates.push(est)
  }

  const series = pl.Series('Est. play time', estimates)
  return df.withColumn(series)
}

export function getPointOdds(
  df: pl.DataFrame,
  {
    point,
    col,
    map,
    names,
  }: {
    point: number
    col: PlayerTableCol
    map: OddsMap
    names: string[]
  }
) {
  const fieldMap = map.get(point)
  if (!fieldMap) {
    return
  }

  const playerNames = df.getColumn('Player').cast(pl.String).toArray()

  const odds: (number | undefined)[] = []

  playerNames.forEach((name) => {
    let o: number | undefined

    const match = findBestPlayerMatch(name, names)

    if (match) {
      const typeMap = fieldMap.get(match.name)
      if (typeMap) {
        o = typeMap.get('Over')
      }
    }

    odds.push(o)
  })

  return pl.Series(`Odds ${col} > ${point}`, odds)
}

export function addPercentageDiff(df: pl.DataFrame) {
  return df.withColumn(
    pl
      .col('Predict SoT > 0.5')
      .sub(pl.col('Odds SoT > 0.5'))
      .div(pl.col('Predict SoT > 0.5'))
      .mul(100)
      .alias('pct_diff')
  )
}

export function saveToXlsx(df: pl.DataFrame) {
  const workbook = xlsx.utils.book_new()

  const data = df.toRecords()
  const worksheet = xlsx.utils.json_to_sheet(data)
  xlsx.utils.book_append_sheet(workbook, worksheet, `Results`)

  xlsx.writeFile(workbook, 'betmax.xlsx')
}

export function join(dfs: pl.DataFrame[]) {
  const suffix = ':drop'

  return dfs.reduce((acc, df) => {
    const joined = acc.join(df, {
      on: 'Player',
      how: 'full',
      suffix,
    })

    const commonCols = joined.columns
      .filter((col) => col.endsWith(suffix))
      .map((col) => col.split(':')[0])

    return joined
      .withColumns(
        ...commonCols.map((col) =>
          pl
            .col(col)
            .fillNull(pl.col(col + suffix))
            .alias(col)
        )
      )
      .select(...joined.columns.filter((col) => !col.endsWith(suffix)))
  })
}

export function stack(dfs: pl.DataFrame[]) {
  return dfs.reduce((acc, df) => {
    return pl.concat([acc, df], { how: 'diagonal' })
  })
}
