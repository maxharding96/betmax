import { z } from 'zod'
import {
  bettingFieldEnum,
  bettingFieldType,
  dateOptionEnum,
  leagueEnum,
} from './internal'

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
  'Leicester',
  'Middlesbrough',
  'Millwall',
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
  'Northampton',
  'Rotherham',
  'AFC Wimbledon',
  'Port Vale',
  'Burton',
  'Bolton',
  'Exeter',
  'Reading',
  'Leyton Orient',
  'Doncaster',
  'Stockport',
  'Blackpool',
  'Wigan',
  'Wycombe',
  // Champions league
  'AEP Paphos',
  'Ajax',
  'Atalanta',
  'Athletic Bilbao',
  'Atletico Madrid',
  'Barcelona',
  'Bayer Leverkusen',
  'Bayern Munich',
  'Benfica',
  'Bodo Glimt',
  'Borussia Dortmund',
  'Chelsea',
  'Club Brugge',
  'Eintracht Frankfurt',
  'FC Copenhagen',
  'FK Qarabag',
  'Galatasaray',
  'Inter Milan',
  'Juventus',
  'Kairat Almaty',
  'Marseille',
  'Monaco',
  'Napoli',
  'Newcastle',
  'Olympiakos',
  'PSG',
  'PSV',
  'Real Madrid',
  'Slavia Prague',
  'Sporting Lisbon',
  'Union St Gilloise',
  'Villarreal',
  // Europa League
  'Basel',
  'Bologna',
  'Braga',
  'Celta Vigo',
  'Celtic',
  'Crvena Zvezda',
  'Dinamo Zagreb',
  'FC Midtjylland',
  'FC Porto',
  'FC Utrecht',
  'FCSB',
  'Fenerbahce',
  'Ferencvaros',
  'Feyenoord',
  'Genk',
  'Go Ahead Eagles',
  'Lille',
  'Ludogorets Razgrad',
  'Lyon',
  'Maccabi Tel Aviv',
  'Malmo FF',
  'Nice',
  'Panathinaikos',
  'PAOK Salonika',
  'Plzen',
  'Rangers',
  'Real Betis',
  'Roma',
  'Salzburg',
  'SC Freiburg',
  'SK Brann',
  'SK Sturm Graz',
  'Vfb Stuttgart',
  'Young Boys',
  // World Cup European Qualifiers
  'Albania',
  'Andorra',
  'Armenia',
  'Austria',
  'Azerbaijan',
  'Belarus',
  'Belgium',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
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
  'Netherlands',
  'North Macedonia',
  'Northern Ireland',
  'Norway',
  'Poland',
  'Portugal',
  'Republic of Ireland',
  'Romania',
  'San Marino',
  'Scotland',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'Ukraine',
  'Wales',
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
  dateOption: dateOptionEnum,
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
