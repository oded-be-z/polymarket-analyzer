import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`
  }
  return num.toFixed(decimals)
}

export function formatCurrency(num: number, decimals: number = 2): string {
  return `$${formatNumber(num, decimals)}`
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return `${(num * 100).toFixed(decimals)}%`
}

export function formatPercent(num: number, decimals: number = 1): string {
  return formatPercentage(num, decimals)
}

export function getSentimentColor(score: number): string {
  if (score > 0.2) return 'text-bullish-500'
  if (score < -0.2) return 'text-bearish-500'
  return 'text-gray-400'
}

export function getSentimentBgColor(score: number): string {
  if (score > 0.2) return 'bg-bullish-500/10 border-bullish-500/30'
  if (score < -0.2) return 'bg-bearish-500/10 border-bearish-500/30'
  return 'bg-gray-500/10 border-gray-500/30'
}

export function getSentimentLabel(score: number): string {
  if (score > 0.5) return 'Strongly Bullish'
  if (score > 0.2) return 'Bullish'
  if (score < -0.5) return 'Strongly Bearish'
  if (score < -0.2) return 'Bearish'
  return 'Neutral'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
