import { z } from 'zod'
import { bettingFieldEnum, bettingFieldType, leagueEnum } from './internal'

const getMatchesInputSchema = z.object({
  league: leagueEnum,
})

export type GetMatchesInput = z.infer<typeof getMatchesInputSchema>

export const teamEnum = z.enum([
  // Premier League
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
  'Leeds',
  'Liverpool',
  'Man City',
  'Man Utd',
  'Newcastle',
  'Nottingham Forest',
  'Sunderland',
  'Tottenham',
  'West Ham',
  'Wolverhampton',
  // Championship
  'Birmingham',
  'Blackburn',
  'Bristol City',
  'Charlton',
  'Coventry',
  'Derby',
  'Hull',
  'Ipswich',
  'Leicester',
  'Middlesbrough',
  'Millwall',
  'Norwich',
  'Oxford',
  'Portsmouth',
  'Preston',
  'QPR',
  'Southampton',
  'Sheffield Utd',
  'Sheffield Wednesday',
  'Stoke',
  'Swansea',
  'Watford',
  'West Brom',
  'Wrexham',
  // League One
  'AFC Wimbledon',
  'Barnsley',
  'Blackpool',
  'Bradford City',
  'Bolton',
  'Burton',
  'Cardiff City',
  'Doncaster',
  'Exeter',
  'Huddersfield',
  'Leyton Orient',
  'Lincoln',
  'Luton',
  'Mansfield',
  'Northampton',
  'Reading',
  'Rotherham',
  'Peterborough United',
  'Plymouth Argyle',
  'Port Vale',
  'Stevenage',
  'Stockport',
  'Wigan',
  'Wycombe',
  // La Liga
  'Alaves',
  'Athletic Bilbao',
  'Atletico Madrid',
  'Barcelona',
  'Celta Vigo',
  'Elche',
  'Espanyol',
  'Getafe',
  'Girona',
  'Levante',
  'Osasuna',
  'Oviedo',
  'Rayo Vallecano',
  'Real Betis',
  'Real Madrid',
  'Real Mallorca',
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
  'Dundee Utd',
  'Aberdeen',
  'Kilmarnock',
  'St Mirren',
  'Dundee',
  'Livingston',
])

export type Team = z.infer<typeof teamEnum>

const matchSchema = z.object({
  league: leagueEnum,
  home: teamEnum,
  away: teamEnum,
})

export type Match = z.infer<typeof matchSchema>

const getMatchesOutputSchema = z.object({
  matches: matchSchema.array(),
})

export type GetMatchesOutput = z.infer<typeof getMatchesOutputSchema>

const getOddsInputSchema = z.object({
  fields: bettingFieldEnum.array(),
  match: matchSchema,
})

export type GetOddsInput = z.infer<typeof getOddsInputSchema>

const oddsSchema = z.object({
  type: bettingFieldType,
  point: z.float32(),
  player: z.string(),
  price: z.float32(),
})

export type Odds = z.infer<typeof oddsSchema>

const getFieldOddsInputSchema = z.object({
  field: bettingFieldEnum,
})

export type GetFieldOddsInput = z.infer<typeof getFieldOddsInputSchema>

export const getFieldOddsOutputSchema = z.object({
  field: bettingFieldEnum,
  odds: oddsSchema.array(),
})

export type GetFieldOddsOutput = z.infer<typeof getFieldOddsOutputSchema>

const getOddsOutputSchema = z.object({
  match: matchSchema,
  oddsByField: getFieldOddsOutputSchema.array(),
})

export type GetOddsOutput = z.infer<typeof getOddsOutputSchema>
