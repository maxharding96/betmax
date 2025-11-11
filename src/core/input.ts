import { select, checkbox } from '@inquirer/prompts'
import {
  leagueEnum,
  type League,
  bettingFieldEnum,
  type BettingField,
} from '@/types/internal'

export function selectLeague(): Promise<League> {
  return select<League>({
    message: 'Which league would you like?',
    choices: leagueEnum.options,
  })
}

export function selectFixtures(fixtures: string[]): Promise<string[]> {
  return checkbox<string>({
    message: 'Which matches do you want to look at?',
    choices: fixtures,
    required: true,
  })
}

export function selectFields(): Promise<BettingField[]> {
  return checkbox<BettingField>({
    message: 'Which betting fields do you want?',
    choices: bettingFieldEnum.options,
    required: true,
  })
}

export function selectPoints(): Promise<number[]> {
  return checkbox<string>({
    message: 'Which points do you want to consider?',
    choices: ['0.5', '1.5', '2.5'],
    required: true,
  }).then((ps) => ps.map(parseFloat))
}
