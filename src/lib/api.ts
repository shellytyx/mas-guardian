import type { DailyCheck, LabVisit, Patient } from '../types'
import { initialChecks, initialVisits, patient as mockPatient } from '../data/mock'

const KEY = 'mas-guardian-v2'

interface Persisted {
  visits: LabVisit[]
  checks: DailyCheck[]
}

export interface ApiClient {
  getPatient(): Promise<Patient>
  getVisits(): Promise<LabVisit[]>
  getChecks(): Promise<DailyCheck[]>
  saveVisit(v: Omit<LabVisit, 'id'>): Promise<LabVisit>
  saveCheck(c: DailyCheck): Promise<void>
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Persisted
  } catch {
    /* ignore */
  }
  return { visits: initialVisits, checks: initialChecks }
}

function save(p: Persisted) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

let state = load()

export const api: ApiClient = {
  async getPatient() {
    await delay(80)
    return mockPatient
  },
  async getVisits() {
    await delay(80)
    return [...state.visits].sort((a, b) => a.date.localeCompare(b.date))
  },
  async getChecks() {
    await delay(80)
    return [...state.checks].sort((a, b) => a.date.localeCompare(b.date))
  },
  async saveVisit(v) {
    await delay(200)
    const visit: LabVisit = { ...v, id: `v${Date.now()}` }
    state.visits = [...state.visits.filter((x) => x.date !== visit.date), visit]
    save(state)
    return visit
  },
  async saveCheck(c) {
    await delay(120)
    state.checks = [...state.checks.filter((x) => x.date !== c.date), c]
    save(state)
  },
}
