export type GamePricingConfig = {
  [gameType: string]: Record<string, number>;
};

export const DEFAULT_PRICING_CONFIG: GamePricingConfig = {
  'PC': { '30': 40, '60': 70, '120': 130 },
  'Console': { '30': 50, '60': 90, '120': 170 },
  'VR': { '30': 100, '60': 180, '120': 350 }
};

export function normalizePricingConfig(raw: any): GamePricingConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_PRICING_CONFIG;
  }

  const validated: GamePricingConfig = {};
  
  for (const [gameType, pricing] of Object.entries(raw)) {
    if (pricing && typeof pricing === 'object' && !Array.isArray(pricing)) {
      const typePricing: Record<string, number> = {};
      for (const [mins, price] of Object.entries(pricing as Record<string, any>)) {
        if (!isNaN(Number(mins)) && typeof price === 'number') {
          typePricing[mins] = price;
        }
      }
      if (Object.keys(typePricing).length > 0) {
        validated[gameType] = typePricing;
      }
    }
  }

  return Object.keys(validated).length > 0 ? validated : DEFAULT_PRICING_CONFIG;
}
