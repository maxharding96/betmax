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
    case 'World Cup European Qualifiers':
      return common + 'WCQ----UEFA-M-Stats'
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
    case 'World Cup European Qualifiers':
      return '6'
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
    // Champions League
    case 'AEP Paphos':
      return 'Pafos FC'
    case 'Athletic Bilbao':
      return 'Athletic Club'
    case 'Atletico Madrid':
      return 'Atlético Madrid'
    case 'Bayer Leverkusen':
      return 'Leverkusen'
    case 'Bayern Munich':
      return 'Bayern München'
    case 'Bodo Glimt':
      return 'Bodø/Glimt'
    case 'Borussia Dortmund':
      return 'Dortmund'
    case 'Eintracht Frankfurt':
      return 'Eint Frankfurt'
    case 'Inter Milan':
      return 'Inter'
    case 'Olympiakos':
      return 'Olympiacos'
    case 'PSG':
      return 'Paris S-G'
    case 'PSV':
      return 'PSV Eindhoven'
    case 'FK Qarabag':
      return 'Qarabağ'
    case 'Kairat Almaty':
      return 'Qaırat Almaty'
    case 'Sporting Lisbon':
      return 'Sporting CP'
    case 'Union St Gilloise':
      return 'Union SG'
    // Europa League
    case 'Crvena Zvezda':
      return 'Red Star'
    case 'FC Midtjylland':
      return 'Midtjylland'
    case 'FC Porto':
      return 'Porto'
    case 'FC Utrecht':
      return 'Utrecht'
    case 'Fenerbahce':
      return 'Fenerbahçe'
    case 'Ferencvaros':
      return 'Ferencváros'
    case 'Go Ahead Eagles':
      return 'Go Ahead Eag'
    case 'Ludogorets Razgrad':
      return 'Ludogorets'
    case 'Malmo FF':
      return 'Malmö'
    case 'PAOK Salonika':
      return 'PAOK'
    case 'Plzen':
      return 'Viktoria Plzeň'
    case 'Real Betis':
      return 'Betis'
    case 'Salzburg':
      return 'RB Salzburg'
    case 'SC Freiburg':
      return 'Freiburg'
    case 'SK Brann':
      return 'Brann'
    case 'SK Sturm Graz':
      return 'Sturm Graz'
    case 'Vfb Stuttgart':
      return 'Stuttgart'
    // World Cup European Qualifiers
    case 'Bosnia and Herzegovina':
      return 'Bosnia & Herzegovina'
    case 'Czech Republic':
      return 'Czechia'
    case 'North Macedonia':
      return 'N. Macedonia'
    case 'Republic of Ireland':
      return 'Rep. of Ireland'
    case 'Turkey':
      return 'Türkiye'
    default:
      return team
  }
}

export function bettingFieldToTeamCol(field: BettingField): SquadTableCol {
  switch (field) {
    case 'Player Shots':
      return 'Sh/90'
    case 'Player Shots On Target':
      return 'SoT/90'
  }
}

export function bettingFieldToPlayerCol(field: BettingField): PlayerTableCol {
  switch (field) {
    case 'Player Shots':
      return 'Sh'
    case 'Player Shots On Target':
      return 'SoT'
  }
}
