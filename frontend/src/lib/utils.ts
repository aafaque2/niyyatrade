import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const centsFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

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

export function formatCents(cents: number | bigint): string {
  return centsFormatter.format(Number(cents) / 100)
}

export function formatCentsCompact(cents: number | bigint): string {
  return compactFormatter.format(Number(cents) / 100)
}

export function formatDollarsCompact(dollars: number | bigint): string {
  return compactFormatter.format(Number(dollars))
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
