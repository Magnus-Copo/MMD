import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format MMD-ID according to MMDSS specification
 * Format: MMD-{GROUP}-{YYYYMMDD}-{SEQUENCE}
 * Example: MMD-REQ-20260202-001
 */
export function formatMmdId(group: string, date: Date, sequence: number): string {
  const dateStr = date.toISOString().slice(0, 10).replaceAll('-', '')
  const seqStr = sequence.toString().padStart(3, '0')
  return `MMD-${group}-${dateStr}-${seqStr}`
}

/**
 * Parse MMD-ID to extract components
 */
export function parseMmdId(mmdId: string): {
  group: string
  date: string
  sequence: number
} | null {
  const regex = /^MMD-([A-Z]+)-(\d{8})-(\d{3})$/
  const match = regex.exec(mmdId)
  
  if (!match) return null
  
  return {
    group: match[1],
    date: match[2],
    sequence: Number.parseInt(match[3], 10)
  }
}
