export type IndicatorKey =
  | 'SF' | 'PLT' | 'AST' | 'ALT' | 'FIB' | 'TG' | 'LDH' | 'ESR' | 'WBC' | 'HGB'

export interface IndicatorMeta {
  key: IndicatorKey
  name: string
  unit: string
  refLow: number
  refHigh: number
  badDirection: 'up' | 'down'
  group: '炎症' | '血液' | '肝功能' | '凝血' | '代谢'
}

export const INDICATORS: Record<IndicatorKey, IndicatorMeta> = {
  SF:  { key: 'SF',  name: '铁蛋白',     unit: 'ng/mL',  refLow: 30,    refHigh: 300,   badDirection: 'up',   group: '炎症' },
  PLT: { key: 'PLT', name: '血小板',     unit: '×10⁹/L', refLow: 100,   refHigh: 300,   badDirection: 'down', group: '血液' },
  AST: { key: 'AST', name: 'AST',        unit: 'U/L',    refLow: 15,    refHigh: 40,    badDirection: 'up',   group: '肝功能' },
  ALT: { key: 'ALT', name: 'ALT',        unit: 'U/L',    refLow: 7,     refHigh: 40,    badDirection: 'up',   group: '肝功能' },
  FIB: { key: 'FIB', name: '纤维蛋白原', unit: 'g/L',    refLow: 2.0,   refHigh: 4.0,   badDirection: 'down', group: '凝血' },
  TG:  { key: 'TG',  name: '甘油三酯',   unit: 'mmol/L', refLow: 0.3,   refHigh: 1.7,   badDirection: 'up',   group: '代谢' },
  LDH: { key: 'LDH', name: 'LDH',        unit: 'U/L',    refLow: 120,   refHigh: 250,   badDirection: 'up',   group: '炎症' },
  ESR: { key: 'ESR', name: '血沉 ESR',   unit: 'mm/h',   refLow: 0,     refHigh: 20,    badDirection: 'up',   group: '炎症' },
  WBC: { key: 'WBC', name: '白细胞',     unit: '×10⁹/L', refLow: 4.0,   refHigh: 10.0,  badDirection: 'down', group: '血液' },
  HGB: { key: 'HGB', name: '血红蛋白',   unit: 'g/L',    refLow: 110,   refHigh: 150,   badDirection: 'down', group: '血液' },
}

export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red' | 'gray'

export interface LabVisit {
  id: string
  date: string
  values: Partial<Record<IndicatorKey, number>>
  source: 'photo' | 'manual' | 'doctor'
  verified: boolean
  rawPhoto?: boolean
}

export interface DailyCheck {
  date: string
  temp?: number
  subjective?: string
}

export interface Patient {
  id: string
  name: string
  age: number
  diagnosis: string
  sjiaStatus: 'confirmed' | 'suspected' | 'no'
  hasFever: boolean
}

export interface Reason {
  ruleId: string
  text: string
  severity: 'red' | 'orange' | 'yellow'
}

export interface RiskResult {
  level: RiskLevel
  headline: string
  reasons: Reason[]
  msScore: number | null
  msPositive: boolean
  criteria2016: { ferritinOk: boolean; hits: string[]; met: boolean }
  ratios: { ferEsr: number | null; ferPlt: number | null }
  updatedAt: string
}

export type Page =
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'detail' }
  | { name: 'alert' }
  | { name: 'capture' }
  | { name: 'entry' }
  | { name: 'compare' }
  | { name: 'warm' }
