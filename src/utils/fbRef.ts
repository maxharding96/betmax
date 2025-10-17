import type {
  LeagueCode,
  PlayerTableCol,
  SquadTableCol,
  Stat,
  Team,
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
  const common = `/comps/${leagueToLeagueCode(league)}/${stat}/`

  switch (league) {
    case 'Premier League':
      return common + 'Premier-League-Stats'
    case 'Championship':
      return common + 'Championship-Stats'
    case 'League 1':
      return common + 'League-One-Stats'
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
    case 'Leicester':
      return 'Leicester City'
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
    case 'Rotherham':
      return 'Rotherham Utd'
    case 'Wigan':
      return 'Wigan Athletic'
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
