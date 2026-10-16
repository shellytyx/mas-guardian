import type { IndicatorKey } from '../types'

interface ParsedIndicator {
  key: IndicatorKey
  value: number
  rawText: string
  confidence: number
}

const KEYWORDS: Record<IndicatorKey, string[]> = {
  SF: ['铁蛋白', 'SF', 'Ferritin', 'FERR', 'ferritin'],
  PLT: ['血小板', 'PLT', 'Platelet', 'PLAT', 'platelet', '血小板计数'],
  AST: ['AST', '天门冬氨酸', 'GOT', 'Aspartate', 'ast'],
  ALT: ['ALT', '丙氨酸', 'GPT', 'Alanine', 'alt'],
  FIB: ['纤维蛋白原', 'FIB', 'Fibrinogen', 'fib'],
  TG: ['甘油三酯', 'TG', 'Triglyceride', 'triglyceride', 'tg'],
  LDH: ['LDH', '乳酸脱氢酶', 'Lactate', 'ldh'],
  ESR: ['ESR', '血沉', '红细胞沉降', 'esr'],
  WBC: ['WBC', '白细胞', 'White blood', 'wbc', '白细胞计数'],
  HGB: ['HGB', '血红蛋白', 'Hemoglobin', 'Hb', 'hgb', 'HGB'],
}

function extractNumber(text: string): number | null {
  const cleaned = text.replace(/,/g, '').replace(/[×xX*]\s*10\s*[\^⁹9]/g, '')
  const match = cleaned.match(/(\d+\.?\d*)/)
  if (!match) return null
  const n = parseFloat(match[1])
  return Number.isFinite(n) ? n : null
}

function convertUnit(key: IndicatorKey, value: number, unitText: string): number {
  const u = unitText.toLowerCase()
  if (key === 'FIB') {
    if (u.includes('mg') || value > 20) return Math.round((value / 100) * 100) / 100
    return value
  }
  if (key === 'TG') {
    if (u.includes('mg') || value > 20) return Math.round((value / 88.57) * 100) / 100
    return value
  }
  if (key === 'PLT') {
    if (value > 2000) return Math.round(value / 1000)
    return value
  }
  return value
}

export function parseOcrText(text: string): ParsedIndicator[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: ParsedIndicator[] = []
  const found = new Set<IndicatorKey>()

  for (const line of lines) {
    for (const [key, keywords] of Object.entries(KEYWORDS) as [IndicatorKey, string[]][]) {
      if (found.has(key)) continue
      const matched = keywords.some((kw) => line.includes(kw))
      if (!matched) continue

      const afterKeyword = line.split(keywords.find((kw) => line.includes(kw))!)[1] ?? line
      const value = extractNumber(afterKeyword)
      if (value == null) continue

      const unitMatch = afterKeyword.match(/(ng\/ml|ug\/l|g\/l|mg\/dl|mmol\/l|u\/l|mm\/h|×10⁹\/l|10\^9\/l)/i)
      const converted = convertUnit(key, value, unitMatch?.[0] ?? '')

      results.push({ key, value: converted, rawText: line, confidence: 0.85 })
      found.add(key)
      break
    }
  }

  return results
}
