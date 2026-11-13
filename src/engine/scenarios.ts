import type { Controls, ScenarioId } from './types'

export const DEFAULT_CONTROLS: Controls = {
  scenario: 'bbd',
  daysToEvent: 21,
  elasticityMult: 1,
  seasonality: 1.15,
  competitorPrice: 0,
  feeLevel: 'current',
  pullForward: 0.15,
  stockMult: 1,
  marginFloor: 0.2,
  goal: 'clear',
}

export const SCENARIOS: Record<Exclude<ScenarioId, 'custom'>, { label: string; blurb: string; controls: Partial<Controls> }> = {
  normal: { label: 'Normal week', blurb: 'No event, steady demand.', controls: { daysToEvent: 60, seasonality: 1, competitorPrice: 0, elasticityMult: 1, pullForward: 0.12, stockMult: 1, feeLevel: 'current', goal: 'margin' } },
  bbd: { label: 'Big Billion Days', blurb: 'Festive demand spike in 3 weeks; buyers hunt deals.', controls: { daysToEvent: 21, seasonality: 1.15, competitorPrice: 0, elasticityMult: 1, pullForward: 0.15, stockMult: 1, feeLevel: 'current', goal: 'clear' } },
  monsoon: { label: 'Monsoon slump', blurb: 'Footfall down, sunscreen stalls, stock piles up.', controls: { daysToEvent: 45, seasonality: 0.75, competitorPrice: -0.05, elasticityMult: 1.1, pullForward: 0.1, stockMult: 1.2, feeLevel: 'current', goal: 'clear' } },
  'price-war': { label: 'Competitor price war', blurb: 'Rivals cut prices 18%; buyers compare harder.', controls: { daysToEvent: 21, seasonality: 1.05, competitorPrice: -0.18, elasticityMult: 1.35, pullForward: 0.18, stockMult: 1, feeLevel: 'current', goal: 'grow' } },
  overstock: { label: 'Overstock crisis', blurb: 'A bulk reorder landed: 1.8× stock everywhere.', controls: { daysToEvent: 30, seasonality: 1, competitorPrice: 0, elasticityMult: 1, pullForward: 0.12, stockMult: 1.8, feeLevel: 'current', goal: 'clear' } },
}
