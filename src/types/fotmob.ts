import { z } from 'zod'

export const teamEnum = z.enum([
  // Premier League
  'AFC Bournemouth',
  'Arsenal',
  'Aston Villa',
  'Brentford',
  'Brighton & Hove Albion',
  'Burnley',
  'Chelsea',
  'Crystal Palace',
  'Everton',
  'Fulham',
  'Leeds',
  'Liverpool',
  'Manchester City',
  'Manchester United',
  'Newcastle United',
  'Nottingham Forest',
  'Sunderland',
  'Tottenham Hotspur',
  'West Ham',
  'Wolverhampton Wanderers',
])

export type Team = z.infer<typeof teamEnum>
