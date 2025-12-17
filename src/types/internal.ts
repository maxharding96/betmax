import { z } from 'zod'

export const leagueEnum = z.enum([
  'Premier League',
  'Championship',
  'League 1',
  'La Liga',
  'Scottish Premier League',
  'Bundesliga',
  'Seria A',
])

export type League = z.infer<typeof leagueEnum>

export const bettingFieldEnum = z.enum([
  'Player Shots On Target',
  'Player Shots',
])

export type BettingField = z.infer<typeof bettingFieldEnum>

export const bettingFieldType = z.enum(['Over', 'Under'])

export type BettingFieldType = z.infer<typeof bettingFieldType>

export type OddsMap = Map<number, Map<string, Map<BettingFieldType, number>>>
