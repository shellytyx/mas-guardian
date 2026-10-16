import type { IndicatorKey, LabVisit, DailyCheck, Patient } from '../types'

export const patient: Patient = {
  id: 'p1',
  name: 'QQ',
  age: 6,
  diagnosis: 'sJIA · 确诊 2 年',
  sjiaStatus: 'confirmed',
  hasFever: true,
}

export const initialVisits: LabVisit[] = [
  {
    id: 'v1', date: '2026-08-20', source: 'photo', verified: true, rawPhoto: true,
    values: { SF: 620, PLT: 340, AST: 22, ALT: 18, FIB: 4.5, TG: 1.2, LDH: 290, ESR: 48, WBC: 9.8, HGB: 118 },
  },
  {
    id: 'v2', date: '2026-08-30', source: 'photo', verified: true, rawPhoto: true,
    values: { SF: 780, PLT: 310, AST: 26, ALT: 21, FIB: 4.3, TG: 1.3, LDH: 310, ESR: 52, WBC: 10.2, HGB: 116 },
  },
  {
    id: 'v3', date: '2026-09-08', source: 'photo', verified: true, rawPhoto: true,
    values: { SF: 950, PLT: 295, AST: 30, ALT: 25, FIB: 4.1, TG: 1.4, LDH: 330, ESR: 55, WBC: 9.5, HGB: 114 },
  },
  {
    id: 'v4', date: '2026-09-18', source: 'manual', verified: false,
    values: { SF: 420, PLT: 230, AST: 38, ALT: 31, FIB: 4.3, TG: 1.6, LDH: 340, ESR: 50, WBC: 8.9, HGB: 112 },
  },
  {
    id: 'v5', date: '2026-09-28', source: 'photo', verified: true, rawPhoto: true,
    values: { SF: 520, PLT: 215, AST: 42, ALT: 38, FIB: 4.15, TG: 1.68, LDH: 420, ESR: 46, WBC: 8.2, HGB: 110 },
  },
  {
    id: 'v6', date: '2026-10-06', source: 'photo', verified: true, rawPhoto: true,
    values: { SF: 610, PLT: 200, AST: 45, ALT: 44, FIB: 4.0, TG: 1.72, LDH: 500, ESR: 42, WBC: 7.6, HGB: 108 },
  },
  {
    id: 'v7', date: '2026-10-12', source: 'photo', verified: true, rawPhoto: true,
    values: { SF: 700, PLT: 176, AST: 46, ALT: 40, FIB: 3.9, TG: 1.74, LDH: 580, ESR: 38, WBC: 6.9, HGB: 105 },
  },
]

export const initialChecks: DailyCheck[] = [
  { date: '2026-10-10', temp: 37.8 },
  { date: '2026-10-11', temp: 38.6 },
  { date: '2026-10-12', temp: 38.9 },
  { date: '2026-10-13', temp: 39.2 },
  { date: '2026-10-14', temp: 38.8 },
  { date: '2026-10-15', temp: 39.1, subjective: '吃了披萨很开心，说肚子有一点点疼' },
]

export const today = '2026-10-15'

export const PENDING_OCR: Partial<Record<IndicatorKey, { value: number; conf: number }>> = {
  SF:  { value: 760,  conf: 0.97 },
  PLT: { value: 170,  conf: 0.96 },
  AST: { value: 47,   conf: 0.95 },
  ALT: { value: 38,   conf: 0.93 },
  FIB: { value: 3.85, conf: 0.94 },
  TG:  { value: 1.75, conf: 0.71 },
  LDH: { value: 620,  conf: 0.92 },
  ESR: { value: 36,   conf: 0.89 },
  WBC: { value: 6.5,  conf: 0.85 },
  HGB: { value: 103,  conf: 0.91 },
}
