export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  /** Starting balance in smallest currency unit (e.g. cents, paise) */
  startingBalanceCents: number;
}

export const CURRENCIES: CurrencyConfig[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    startingBalanceCents: 10_000_000,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    startingBalanceCents: 10_000_000_00,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    startingBalanceCents: 10_000_000,
  },
  { code: 'EUR', name: 'Euro', symbol: '€', startingBalanceCents: 10_000_000 },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    startingBalanceCents: 500_000_000,
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    startingBalanceCents: 500_000_000,
  },
];

export const DEFAULT_CURRENCY = 'USD';

export const VALID_CURRENCY_CODES = CURRENCIES.map((c) => c.code);

export function getCurrencyConfig(code: string): CurrencyConfig | undefined {
  return CURRENCIES.find((c) => c.code === code.toUpperCase());
}

export function getStartingBalance(code: string): number {
  return getCurrencyConfig(code)?.startingBalanceCents ?? 10_000_000;
}
