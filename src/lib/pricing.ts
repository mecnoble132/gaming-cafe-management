export type GamePricingConfig = {
  [key: string]: Record<string, number> | Array<{ label: string; price: number; minutes: number }>;
};

export const DEFAULT_PRICING_CONFIG: GamePricingConfig = {};

export function normalizePricingConfig(raw: any): GamePricingConfig {
  return raw ?? {};
}
