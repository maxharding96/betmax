import pl from 'nodejs-polars'
import { z } from 'zod'
import { leagueEnum } from './internal'

export const premierLeagueTeamEnum = z.enum([
  'Arsenal',
  'Aston Villa',
  'Bournemouth',
  'Brentford',
  'Brighton',
  'Burnley',
  'Chelsea',
  'Crystal Palace',
  'Everton',
  'Fulham',
  'Leeds United',
  'Liverpool',
  'Manchester City',
  'Manchester Utd',
  'Newcastle Utd',
  "Nott'ham Forest",
  'Sunderland',
  'Tottenham',
  'West Ham',
  'Wolves',
])

export type PremierLeagueTeam = z.infer<typeof premierLeagueTeamEnum>

export const championshipTeamEnum = z.enum([
  'Birmingham City',
  'Blackburn',
  'Bristol City',
  'Charlton Ath',
  'Coventry City',
  'Derby County',
  'Hull City',
  'Ipswich Town',
  'Leicester City',
  'Middlesbrough',
  'Millwall',
  'Norwich City',
  'Oxford United',
  'Portsmouth',
  'Preston',
  'QPR',
  'Sheffield Utd',
  'Sheffield Weds',
  'Southampton',
  'Stoke City',
  'Swansea City',
  'Watford',
  'West Brom',
  'Wrexham',
])

export type ChampionshipTeam = z.infer<typeof championshipTeamEnum>

export const leagueOneTeamEnum = z.enum([
  'AFC Wimbledon',
  'Barnsley',
  'Blackpool',
  'Bolton',
  'Bradford City',
  'Burton Albion',
  'Cardiff City',
  'Doncaster',
  'Exeter City',
  'Huddersfield',
  'Leyton Orient',
  'Lincoln City',
  'Luton Town',
  'Mansfield Town',
  'Northampton',
  "P'borough Utd",
  'Plymouth Argyle',
  'Port Vale',
  'Reading',
  'Rotherham Utd',
  'Stevenage',
  'Stockport',
  'Wigan Athletic',
  'Wycombe',
])

export type LeagueOneTeam = z.infer<typeof leagueCodeEnum>

const championsLeagueTeamEnum = z.enum([
  'Ajax',
  'Arsenal',
  'Atalanta',
  'Athletic Club',
  'Atlético Madrid',
  'Barcelona',
  'Bayern München',
  'Benfica',
  'Bodø/Glimt',
  'Chelsea',
  'Club Brugge',
  'Dortmund',
  'Eint Frankfurt',
  'FC Copenhagen',
  'Galatasaray',
  'Inter',
  'Juventus',
  'Leverkusen',
  'Liverpool',
  'Manchester City',
  'Marseille',
  'Monaco',
  'Napoli',
  'Newcastle Utd',
  'Olympiacos',
  'Pafos FC',
  'Paris S-G',
  'PSV Eindhoven',
  'Qaırat Almaty',
  'Qarabağ',
  'Real Madrid',
  'Slavia Prague',
  'Sporting CP',
  'Tottenham',
  'Union SG',
  'Villarreal',
])

export type ChampionsLeagueTeam = z.infer<typeof championsLeagueTeamEnum>

export const europaLeagueTeamEnum = z.enum([
  'Aston Villa',
  'Basel',
  'Betis',
  'Bologna',
  'Braga',
  'Brann',
  'Celtic',
  'Celta Vigo',
  'Dinamo Zagreb',
  'FCSB',
  'Fenerbahçe',
  'Ferencváros',
  'Feyenoord',
  'Freiburg',
  'Genk',
  'Go Ahead Eag',
  'Lille',
  'Ludogorets',
  'Lyon',
  'Maccabi Tel Aviv',
  'Malmö',
  'Midtjylland',
  'Nice',
  "Nott'ham Forest",
  'Panathinaikos',
  'PAOK',
  'Porto',
  'Rangers',
  'RB Salzburg',
  'Red Star',
  'Roma',
  'Sturm Graz',
  'Stuttgart',
  'Utrecht',
  'Viktoria Plzeň',
  'Young Boys',
])

export type EuropaLeagueTeam = z.infer<typeof europaLeagueTeamEnum>

export const uefaCountryEnum = z.enum([
  'Albania',
  'Andorra',
  'Armenia',
  'Austria',
  'Azerbaijan',
  'Belarus',
  'Belgium',
  'Bosnia & Herzegovina',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Denmark',
  'England',
  'Estonia',
  'Faroe Islands',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Gibraltar',
  'Greece',
  'Hungary',
  'Iceland',
  'Israel',
  'Italy',
  'Kazakhstan',
  'Kosovo',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Moldova',
  'Montenegro',
  'N. Macedonia',
  'Netherlands',
  'Northern Ireland',
  'Norway',
  'Poland',
  'Portugal',
  'Rep. of Ireland',
  'Romania',
  'San Marino',
  'Scotland',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Türkiye',
  'Ukraine',
  'Wales',
])

export type UefaCountry = z.infer<typeof uefaCountryEnum>

export type Team =
  | PremierLeagueTeam
  | ChampionshipTeam
  | LeagueOneTeam
  | ChampionsLeagueTeam
  | EuropaLeagueTeam
  | UefaCountry

const leagueCodeEnum = z.enum([
  '9', // Premier League
  '10', // Championship
  '8', // Champions League
  '19', // Europa League
  '15', // League 1
  '6', // World Cup European Qualifiers
])

export type LeagueCode = z.infer<typeof leagueCodeEnum>

const seasonEnum = z.enum(['2025-2026', '2024-2025', '2023-2024'])

export type Season = z.infer<typeof seasonEnum>

const statEnum = z.enum(['shooting', 'misc'])

export type Stat = z.infer<typeof statEnum>

const tableEnum = z.enum(['squad', 'vsSquad', 'player'])

export type Table = z.infer<typeof tableEnum>

const squadTableColEnum = z.enum([
  'Squad',
  '# Pl',
  '90s',
  'Gls',
  'Sh',
  'SoT',
  'SoT%',
  'Sh/90',
  'SoT/90',
  'G/Sh',
  'G/SoT',
  'Dist',
  'FK',
  'PK',
  'PKatt',
  'xG',
  'npxG',
  'npxG/Sh',
  'G-xG',
  'np:G-xG',
])

export type SquadTableCol = z.infer<typeof squadTableColEnum>

const playerTableColEnum = z.enum([
  'Rk',
  'Player',
  'Nation',
  'Pos',
  'Squad',
  'Age',
  'Born',
  '90s',
  'Gls',
  'Sh',
  'SoT',
  'SoT%',
  'Sh/90',
  'SoT/90',
  'G/Sh',
  'G/SoT',
  'Dist',
  'FK',
  'PK',
  'PKatt',
  'xG',
  'npxG',
  'npxG/Sh',
  'G-xG',
  'np:G-xG',
  'Matches',
])

export type PlayerTableCol = z.infer<typeof playerTableColEnum>

const getStatTablesInputSchema = z.object({
  league: leagueEnum,
  season: seasonEnum,
  stat: statEnum,
})

export type GetStatTablesInput = z.infer<typeof getStatTablesInputSchema>

export type GetStatTablesOutput = Record<Table, pl.DataFrame>
