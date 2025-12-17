import type { League } from '@/types/internal'

export const leagueToCode: Record<League, number> = {
  'Premier League': 47,
  Championship: 48,
  'League 1': 108,
  'La Liga': 87,
  'Seria A': 55,
  Bundesliga: 54,
  'Scottish Premier League': 64,
}

export const leagueToPath: Record<League, string> = {
  'Premier League': 'premier-league',
  Championship: 'championship',
  'League 1': 'league-one',
  'La Liga': 'laliga',
  'Seria A': 'serie',
  Bundesliga: 'bundesliga',
  'Scottish Premier League': 'premiership',
}

// https://www.fotmob.com/en-GB/leagues/54/fixtures/bundesliga?group=by-date

export function getFixturesPath(league: League) {
  return `/en-GB/leagues/${leagueToCode[league]}/fixtures/${leagueToPath[league]}?group=by-date`
}
