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

export interface KnowledgeItem {
  id: string
  title: string
  summary: string
  source?: string
}

export interface ConsultRequest {
  reason: string
  urgency: string
  snapshot: unknown
}

export interface KnowledgeClient {
  search(query: string): Promise<KnowledgeItem[]>
}

export interface LLMClient {
  ask(context: {
    question: string
    risk: unknown
    latestVisit?: LabVisit
    subjective?: string
    knowledge?: KnowledgeItem[]
  }): Promise<string>
}

export interface ConsultClient {
  request(data: ConsultRequest): Promise<{ url?: string; message: string }>
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

// ---------- 后端接口预留：知识库 / LLM / 问诊 ----------
// 接入后端时替换为 fetch('/api/knowledge?query=') 等

export const knowledgeClient: KnowledgeClient = {
  async search(query: string): Promise<KnowledgeItem[]> {
    await delay(120)
    // TODO: 对接后端知识库 GET /api/knowledge?query=
    return []
  },
}

export const llmClient: LLMClient = {
  async ask(context) {
    await delay(300)
    // TODO: 对接后端 POST /api/llm/chat
    const { generateLocalAnswer } = await import('./llmAnswer')
    return generateLocalAnswer(context)
  },
}

export const consultClient: ConsultClient = {
  async request(data) {
    await delay(200)
    // TODO: 对接后端 POST /api/consult，返回医生聊天/问诊链接
    return { message: '线上问诊服务暂未接入，请稍后重试' }
  },
}
