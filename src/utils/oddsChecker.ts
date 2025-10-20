import type { League } from '../types/internal'
import type { Match } from '../types/oddsChecker'
import { slugify } from './common'

export function leagueToPath(league: League): string {
  switch (league) {
    case 'Premier League':
      return '/english/premier-league'
    case 'Championship':
      return '/english/championship'
    case 'League 1':
      return '/english/league-1'
    case 'La Liga':
      return '/spain/la-liga-primera'
  }
}

export function matchToPath(match: Match) {
  const base = leagueToPath(match.league)
  const home = slugify(match.home)
  const away = slugify(match.away)

  return `${base}/${home}-v-${away}/winner`
}
