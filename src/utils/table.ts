import pl from 'nodejs-polars'
import xlsx from 'xlsx'
import type { StatCol, Team } from '../types/fbRef'
import { oddsOfProbability, poissonGreaterOrEqual } from './probabilty'
import { findBestPlayerMatch, roundToTwo } from './common'
import type { OddsMap } from '../types/internal'
import {
  MIN_GAME_STARTED,
  MIN_GAME_TIME,
  VENUE_ALPHA,
} from '../config/constants'

export function getTeamStat(
  df: pl.DataFrame,
  {
    team,
    stat,
    vs,
  }: {
    team: Team
    stat: StatCol
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
    stat: StatCol
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
    lineups,
    col,
  }: {
    team: Team
    lineups: string[] | null
    col: StatCol
  }
) {
  const filtered = df
    .filter(
      pl
        .col('Squad')
        .str.contains(team)
        // Must have played at least MIN_GAME_TIME total
        .and(pl.col('90s').cast(pl.Float32).gtEq(MIN_GAME_TIME))
        // Must have started at least MIN_GAME_STARTED games
        .and(pl.col('Starts').cast(pl.Float32).gt(MIN_GAME_STARTED))
        .and(pl.col(col).cast(pl.Int32).gt(0))
    )
    // TODO players appear as two rows if they have player for more than one club in a season
    .unique({ subset: ['ID'], keep: 'last' })

  if (lineups) {
    const players = filtered.getColumn('Player').cast(pl.String).toArray()
    const mask = players.map((p, i) => !!findBestPlayerMatch(p, lineups))

    return filtered.withColumn(pl.Series('Starting', mask))
    // .filter(pl.col('_mask'))
    // .drop('_mask')
  }

  return filtered
}

export function getPointProbabilities(
  df: pl.DataFrame,
  {
    point,
    col,
    weight,
  }: {
    point: number
    col: StatCol
    weight: number
  }
) {
  const stats = df
    .getColumn(col) // stat total count
    .cast(pl.Float32)
    .div(df.getColumn('90s').cast(pl.Float32)) // divided by time played
    .mul(df.getColumn('Mn/Start').cast(pl.Int32)) // multipled by average time played when starting
    .div(90)
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

  return pl.Series('Prediction', probs)
}

export function getPointOdds(
  df: pl.DataFrame,
  {
    point,
    map,
    names,
  }: {
    point: number
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

  return pl.Series('Odds', odds)
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

export function saveToXlsx(entries: Array<[string, pl.DataFrame]>) {
  const workbook = xlsx.utils.book_new()

  for (const [name, df] of entries) {
    const data = df.toRecords()
    const worksheet = xlsx.utils.json_to_sheet(data)
    xlsx.utils.book_append_sheet(workbook, worksheet, name)
  }

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

export function sortByValue(df: pl.DataFrame) {
  return df.sort('EV (%)', true)
}

export function getTeamVenueStat(
  df: pl.DataFrame,
  {
    stat,
    venue,
  }: {
    stat: StatCol
    venue: 'Home' | 'Away'
  }
) {
  const filtered = df.filter(pl.col('Venue').eq(pl.lit(venue)))
  const total = filtered.getColumn(stat).cast(pl.Int32).sum()

  return total / filtered.height
}

export function getTeamShootingStats(df: pl.DataFrame) {
  const home = df.filter(pl.col('Venue').eq(pl.lit('Home')))
  const away = df.filter(pl.col('Venue').eq(pl.lit('Away')))

  // Need to reverse as this versus
  return {
    Home: {
      SoT: away.getColumn('SoT').cast(pl.Int32).mean(),
      Sh: away.getColumn('Sh').cast(pl.Int32).mean(),
    },
    Away: {
      SoT: home.getColumn('SoT').cast(pl.Int32).mean(),
      Sh: home.getColumn('Sh').cast(pl.Int32).mean(),
    },
  }
}

export function getStatHitRate(
  df: pl.DataFrame,
  {
    stat,
    point,
    venue,
    limit,
  }: {
    stat: StatCol
    point: number
    venue?: 'Home' | 'Away'
    limit?: number
  }
): number {
  try {
    let filtered = df.filter(pl.col('Start').isIn(['Y', 'Y*']))

    if (venue) {
      filtered = filtered.filter(pl.col('Venue').eq(pl.lit(venue)))
    }

    if (limit) {
      filtered = filtered.tail(limit)
    }

    const starts = filtered.height

    if (starts === 0) {
      return 0
    }

    let hits = 0

    const counts = filtered.getColumn(stat).cast(pl.Int32).toArray()

    for (const c of counts) {
      if (c > point) {
        hits++
      }
    }

    return roundToTwo(hits / starts)
  } catch (error) {
    return 0
  }
}

export function getWeightedStat(
  df: pl.DataFrame,
  { stat, mps, isHome }: { stat: StatCol; mps: number; isHome: boolean }
) {
  try {
    const home = df.filter(pl.col('Venue').eq(pl.lit('Home')))
    const away = df.filter(pl.col('Venue').eq(pl.lit('Away')))

    const homeTotal = home.getColumn(stat).cast(pl.Int32).sum()
    const awayTotal = away.getColumn(stat).cast(pl.Int32).sum()

    const homeMinutes = home.getColumn('Min').cast(pl.Int32).sum()
    const awayMinutes = away.getColumn('Min').cast(pl.Int32).sum()

    const homeRate = homeTotal / (homeMinutes / 90)
    const awayRate = awayTotal / (awayMinutes / 90)

    const weighted = isHome
      ? VENUE_ALPHA * homeRate + (1 - VENUE_ALPHA) * awayRate
      : VENUE_ALPHA * awayRate + (1 - VENUE_ALPHA) * homeRate

    return weighted * (mps / 90)
  } catch {
    return 0
  }
}
