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

export function leagueToStatPath({
  league,
  stat,
}: {
  league: League
  stat: Stat
}) {
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
          return ['Squad', 'Sh', 'SoT']
        case 'misc':
          return ['Squad', 'Fls']
      }
    case 'player':
      switch (stat) {
        case 'standard':
          return ['Player', 'Squad', 'MP', 'Starts', 'Min', '90s']
        case 'shooting':
          return ['Player', 'Gls', 'Sh', 'Sh/90', 'SoT', 'SoT/90']
        case 'misc':
          return ['Player', 'CrdY', 'CrdR', 'TklW', 'Fls']
      }
  }
}
