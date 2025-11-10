import type {
  LeagueCode,
  PlayerTableCol,
  SquadTableCol,
  Stat,
  Team,
  Table,
} from '../types/fbRef'
import type { BettingField, League } from '../types/internal'
import type { Team as OddsCheckerTeam } from '../types/oddsChecker'
import { slugify } from './common'

// https://fbref.com/en/players/de31038e/matchlogs/2025-2026/c9/Elliot-Anderson-Match-Logs

export function getPlayerStatMatchLogsPath({
  playerId,
  player,
}: {
  playerId: string
  player: string
}) {
  return `/players/${playerId}/matchlogs/2025-2026/c9/${slugify(
    player
  )}-Match-Logs`
}

// https://fbref.com/en/squads/e4a775cb/2025-2026/matchlogs/c9/shooting/Nottingham-Forest-Match-Logs-Premier-League

export function getTeamMatchStatPath({
  league,
  team,
  teamId,
  stat,
}: {
  league: string
  team: string
  teamId: string
  stat: Stat
}) {
  const statRoute = stat === 'standard' ? 'stats' : stat

  return `/squads/${teamId}/2025-2026/matchlogs/c9/${statRoute}/${slugify(
    team
  )}-Match-Logs-${slugify(league)}`
}

export function leagueToStatPath({
  league,
  stat,
}: {
  league: League
  stat: Stat
}): string {
  const statRoute = stat === 'standard' ? 'stats' : stat

  const common = `/comps/${leagueToLeagueCode(league)}/${statRoute}/`

  switch (league) {
    case 'Premier League':
      return common + 'Premier-League-Stats'
    case 'Championship':
      return common + 'Championship-Stats'
    case 'League 1':
      return common + 'League-One-Stats'
    case 'La Liga':
      return common + 'La-Liga-Stats'
    case 'Scottish Premier League':
      return common + 'Scottish-Premiership-Stats'
    case 'Bundesliga':
      return common + 'Bundesliga-Stats'
    case 'Seria A':
      return common + 'Seria-A-Stats'
  }
}

function leagueToLeagueCode(league: League): LeagueCode {
  switch (league) {
    case 'Premier League':
      return '9'
    case 'Championship':
      return '10'
    case 'League 1':
      return '15'
    case 'La Liga':
      return '12'
    case 'Scottish Premier League':
      return '40'
    case 'Bundesliga':
      return '20'
    case 'Seria A':
      return '11'
  }
}

export function toFbRefTeam(team: OddsCheckerTeam): Team {
  switch (team) {
    // Premier League
    case 'Leeds':
      return 'Leeds United'
    case 'Man City':
      return 'Manchester City'
    case 'Man Utd':
      return 'Manchester Utd'
    case 'Newcastle':
      return 'Newcastle Utd'
    case 'Nottingham Forest':
      return "Nott'ham Forest"
    case 'Wolverhampton':
      return 'Wolves'
    // Championship
    case 'Birmingham':
      return 'Birmingham City'
    case 'Charlton':
      return 'Charlton Ath'
    case 'Coventry':
      return 'Coventry City'
    case 'Derby':
      return 'Derby County'
    case 'Hull':
      return 'Hull City'
    case 'Ipswich':
      return 'Ipswich Town'
    case 'Leicester':
      return 'Leicester City'
    case 'Norwich':
      return 'Norwich City'
    case 'Oxford':
      return 'Oxford United'
    case 'Sheffield Wednesday':
      return 'Sheffield Weds'
    case 'Stoke':
      return 'Stoke City'
    case 'Swansea':
      return 'Swansea City'
    // League one
    case 'Burton':
      return 'Burton Albion'
    case 'Exeter':
      return 'Exeter City'
    case 'Lincoln':
      return 'Lincoln City'
    case 'Luton':
      return 'Luton Town'
    case 'Mansfield':
      return 'Mansfield Town'
    case 'Peterborough United':
      return "P'borough Utd"
    case 'Rotherham':
      return 'Rotherham Utd'
    case 'Wigan':
      return 'Wigan Athletic'
    // La Liga
    case 'Alaves':
      return 'Alavés'
    case 'Athletic Bilbao':
      return 'Athletic Club'
    case 'Atletico Madrid':
      return 'Atlético Madrid'
    case 'Real Betis':
      return 'Betis'
    case 'Real Mallorca':
      return 'Mallorca'
    // SPL
    case 'Dundee Utd':
      return 'Dundee United'
    case 'Mainz':
      return 'Mainz 05'
    case 'TSG Hoffenheim':
      return 'Hoffenheim'
    case 'Hamburg':
      return 'Hamburger SV'
    case 'SC Freiburg':
      return 'Freiburg'
    case 'Borussia Dortmund':
      return 'Dortmund'
    case 'Vfb Stuttgart':
      return 'Stuttgart'
    case 'Borussia Mgladbach':
      return 'Gladbach'
    case 'Bayer Leverkusen':
      return 'Leverkusen'
    case 'Cologne':
      return 'Köln'
    case 'Eintracht Frankfurt':
      return 'Eint Frankfurt'
    case 'St Pauli':
      return 'St. Pauli'
    // Seria A
    case 'AC Milan':
      return 'Milan'
    case 'Inter Milan':
      return 'Inter'
    case 'Verona':
      return 'Hellas Verona'
    default:
      return team
  }
}

export function bettingFieldToTeamCol(field: BettingField): SquadTableCol {
  switch (field) {
    case 'Player Shots':
      return 'Sh'
    case 'Player Shots On Target':
      return 'SoT'
    case 'Player Fouls':
      return 'Fls'
  }
}

export function bettingFieldToPlayerCol(field: BettingField): PlayerTableCol {
  switch (field) {
    case 'Player Shots':
      return 'Sh'
    case 'Player Shots On Target':
      return 'SoT'
    case 'Player Fouls':
      return 'Fls'
  }
}

export function bettingFieldToStat(field: BettingField): Stat {
  switch (field) {
    case 'Player Shots':
    case 'Player Shots On Target':
      return 'shooting'
    case 'Player Fouls':
      return 'misc'
  }
}

export function getColumns({ table, stat }: { table: Table; stat: Stat }) {
  switch (table) {
    case 'squad':
    case 'vsSquad':
      switch (stat) {
        case 'standard':
          return ['Squad', 'MP']
        case 'shooting':
          return ['Squad', 'Sh', 'SoT', '90s']
        case 'misc':
          return ['Squad', 'Fls', '90s']
        case 'playingtime':
          return ['Squad', 'Mn/Start']
      }
    case 'player':
      switch (stat) {
        case 'standard':
          return ['ID', 'Player', 'Squad', 'MP', 'Starts', 'Min', '90s']
        case 'shooting':
          return ['Player', 'Gls', 'Sh', 'Sh/90', 'SoT', 'SoT/90']
        case 'misc':
          return ['Player', 'CrdY', 'CrdR', 'TklW', 'Fls']
        case 'playingtime':
          return ['Player', 'Mn/Start']
      }
  }
}

export function getTableId({
  table,
  stat,
}: {
  table: Table
  stat: Stat
}): string {
  const statId = stat !== 'playingtime' ? stat : 'playing_time'

  switch (table) {
    case 'player':
      return `stats_${statId}`
    case 'squad':
      return `stats_squads_${statId}_for`
    case 'vsSquad':
      return `stats_squads_${statId}_against`
  }
}
