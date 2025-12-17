import pl from 'nodejs-polars'
import { z } from 'zod'
import { leagueEnum } from './internal'

export const teamEnum = z.enum([
  // Premier league
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
  // Championship
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
  // League one
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
  // La Liga
  'Alavés',
  'Athletic Club',
  'Atlético Madrid',
  'Barcelona',
  'Betis',
  'Celta Vigo',
  'Elche',
  'Espanyol',
  'Getafe',
  'Girona',
  'Levante',
  'Mallorca',
  'Osasuna',
  'Oviedo',
  'Rayo Vallecano',
  'Real Madrid',
  'Real Sociedad',
  'Sevilla',
  'Valencia',
  'Villarreal',
  // SPL
  'Hearts',
  'Celtic',
  'Hibernian',
  'Falkirk',
  'Rangers',
  'Motherwell',
  'Dundee United',
  'Aberdeen',
  'Kilmarnock',
  'St Mirren',
  'Dundee',
  'Livingston',
  // Bundesliga
  'Bayern Munich',
  'RB Leipzig',
  'Dortmund',
  'Leverkusen',
  'Hoffenheim',
  'Stuttgart',
  'Werder Bremen',
  'Eint Frankfurt',
  'Köln',
  'Union Berlin',
  'Freiburg',
  'Gladbach',
  'Hamburger SV',
  'Wolfsburg',
  'Augsburg',
  'St. Pauli',
  'Mainz 05',
  'Heidenheim',
  // Seria A
  'Atalanta',
  'Bologna',
  'Cagliari',
  'Como',
  'Cremonese',
  'Fiorentina',
  'Genoa',
  'Hellas Verona',
  'Inter',
  'Juventus',
  'Lazio',
  'Lecce',
  'Milan',
  'Napoli',
  'Parma',
  'Pisa',
  'Roma',
  'Sassuolo',
  'Torino',
  'Udinese',
])

export type Team = z.infer<typeof teamEnum>

const leagueCodeEnum = z.enum([
  '9', // Premier League
  '10', // Championship
  '15', // League 1
  '12', // La Liga
  '40', // SPL
  '20', // Bundesliga
  '11', // Seria A
])

export type LeagueCode = z.infer<typeof leagueCodeEnum>

const seasonEnum = z.enum(['2025-2026', '2024-2025', '2023-2024'])

export type Season = z.infer<typeof seasonEnum>

const statEnum = z.enum(['shooting', 'misc', 'standard', 'playingtime'])

export type Stat = z.infer<typeof statEnum>

const tableEnum = z.enum(['squad', 'vsSquad', 'player'])

export type Table = z.infer<typeof tableEnum>

const statColEnum = z.enum(['Sh', 'SoT'])

export type StatCol = z.infer<typeof statColEnum>

const getPlayerPlayedTableInputSchema = z.object({
  league: leagueEnum,
})

export type GetPlayerPlayedTableInput = z.infer<
  typeof getPlayerPlayedTableInputSchema
>

const getStatTablesInputSchema = z.object({
  league: leagueEnum,
  stat: statEnum,
})

export type GetStatTablesInput = z.infer<typeof getStatTablesInputSchema>

export type Tables = Record<Table, pl.DataFrame>

const venueEnum = z.enum(['Home', 'Away'])

export type Venue = z.infer<typeof venueEnum>

const weightsSchema = z.record(statColEnum, z.number())

const teamWeightsSchema = z.record(venueEnum, weightsSchema)

export const leagueTeamWeightsSchema = z.partialRecord(
  teamEnum,
  teamWeightsSchema
)

export type LeagueTeamWeights = z.infer<typeof leagueTeamWeightsSchema>
