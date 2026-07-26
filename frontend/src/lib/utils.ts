import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  KRW: "₩",
  BRL: "R$",
  SGD: "S$",
  HKD: "HK$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  THB: "฿",
  MYR: "RM",
  IDR: "Rp",
  PHP: "₱",
  MXN: "Mex$",
  AED: "د.إ",
  SAR: "﷼",
  ZAR: "R",
  NZD: "NZ$",
  TWD: "NT$",
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency + " "
}

export function deriveCurrencyFromTicker(ticker: string): string {
  if (/\.(NS|BO|NSE|BSE)$/i.test(ticker)) return "INR"
  if (/\.(L|LN)$/i.test(ticker)) return "GBP"
  if (/\.(DE|F)$/i.test(ticker)) return "EUR"
  if (/\.(T)$/i.test(ticker)) return "JPY"
  if (/\.(TO)$/i.test(ticker)) return "CAD"
  if (/\.(AX)$/i.test(ticker)) return "AUD"
  if (/\.(HK)$/i.test(ticker)) return "HKD"
  if (/\.(SI)$/i.test(ticker)) return "SGD"
  return "USD"
}

function makeCurrencyFormatter(currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function makeCompactCurrencyFormatter(currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
})

const quantityFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
})

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCents(cents: number | bigint, currency: string = "USD"): string {
  return makeCurrencyFormatter(currency).format(Number(cents) / 100)
}

export function formatCentsCompact(cents: number | bigint, currency: string = "USD"): string {
  return makeCompactCurrencyFormatter(currency).format(Number(cents) / 100)
}

export function formatDollarsCompact(dollars: number | bigint, currency: string = "USD"): string {
  return makeCompactCurrencyFormatter(currency).format(Number(dollars))
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value)
}

export function formatQuantity(value: number | string): string {
  return quantityFormatter.format(Number(value))
}

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value)
}

export function formatChange(value: number): { text: string; positive: boolean } {
  const positive = value >= 0
  return {
    text: `${positive ? "+" : ""}${value.toFixed(2)}%`,
    positive,
  }
}
