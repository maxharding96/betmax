import pl from 'nodejs-polars'
import xlsx from 'xlsx'
import type { SquadTableCol, PlayerTableCol, Team } from '../types/fbRef'
import { oddsOfProbability, poissonGreaterOrEqual } from './probabilty'
import { findBestPlayerMatch } from './common'
import type { OddsMap } from '../types/internal'

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
    .filter(pl.col('Squad').str.contains(teamStr)) // Filter for the correct row
    .select(stat) // Select the 'age' column
    .getColumn(stat) // Get the column as a Series
    .get(0)
}

export function getPlayerStatsForTeam(
  df: pl.DataFrame,
  {
    team,
  }: {
    team: string
  }
) {
  return df.filter(pl.col('Squad').str.contains(team))
}

export function getPlayerStat(
  df: pl.DataFrame,
  {
    player,
    stat,
  }: {
    player: string
    stat: PlayerTableCol
  }
) {
  return df
    .filter(pl.col('Player').eq(pl.lit(player))) // Filter for the correct row
    .select(stat) // Select the 'age' column
    .getColumn(stat) // Get the column as a Series
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
  return df.select(pl.col(stat).cast(pl.Float32)).getColumn(stat).mean()
}

export function getPlayerMeanStat(
  df: pl.DataFrame,
  {
    stat,
  }: {
    stat: PlayerTableCol
  }
) {
  return df
    .select(pl.col(stat).cast(pl.Float32))
    .getColumn(stat)
    .mean()
    .toFixed(2)
}

export function getTeamPlayersDf(
  df: pl.DataFrame,
  {
    team,
  }: {
    team: Team
  }
) {
  const COL_SELECTION = [
    'Player',
    'Squad',
    '90s',
    'Sh',
    'SoT',
    'Sh/90',
    'SoT/90',
  ]

  return df
    .filter(
      pl
        .col('Squad')
        .str.contains(team)
        .and(pl.col('90s').cast(pl.Float32).gtEq(1))
    )
    .select(...COL_SELECTION)
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

export function saveToXlsx({
  dfs,
  filename,
}: {
  dfs: pl.DataFrame[]
  filename: string
}) {
  const workbook = xlsx.utils.book_new()

  dfs.forEach((df, index) => {
    const data = df.toRecords()
    const worksheet = xlsx.utils.json_to_sheet(data)
    xlsx.utils.book_append_sheet(workbook, worksheet, `game_${index + 1}`)
  })

  xlsx.writeFile(workbook, filename)
}

export function joinOnPlayer(dfs: pl.DataFrame[]) {
  return dfs.reduce((acc, df) => {
    const joined = acc.join(df, { on: 'Player', how: 'inner', suffix: '_drop' })

    return joined.select(
      ...joined.columns.filter((col) => !col.endsWith('_drop'))
    )
  })
}
