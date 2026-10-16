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
    latestResearch?: KnowledgeItem[]
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

/** 获取网上最新医学研究/指南（后端聚合：PubMed、指南更新等） */
export async function fetchLatestResearch(): Promise<KnowledgeItem[]> {
  try {
    // TODO: 对接后端 GET /api/research/latest
    return []
  } catch {
    return []
  }
}

function buildSystemPrompt(context: {
  risk: unknown
  latestVisit?: LabVisit
  subjective?: string
  knowledge?: KnowledgeItem[]
  latestResearch?: KnowledgeItem[]
}): string {
  const r = context.risk as { level?: string; headline?: string; msScore?: number | null } | null
  const v = context.latestVisit?.values
  const lines: string[] = [
    '你是"MAS 守护者"应用里的 AI 助手，专门帮助 sJIA（系统性幼年特发性关节炎）患儿家长理解化验指标、预警等级和就医建议。',
    '语气要温和、准确、不吓唬人，但也要客观说明风险。所有回答基于以下真实数据：',
  ]
  if (r) {
    lines.push(`当前预警等级：${r.level === 'green' ? '平稳' : r.level === 'yellow' ? '关注' : r.level === 'orange' ? '恶化' : '高危'}。`)
    if (r.headline) lines.push(`预警标题：${r.headline}`)
    if (r.msScore != null) lines.push(`MS 评分：${r.msScore}（临界值 ≥ -2.1）`)
  }
  if (v) {
    lines.push('最近一次化验单：')
    if (v.SF != null) lines.push(`- 铁蛋白 ${v.SF} ng/mL（MAS 阈值 >684）`)
    if (v.PLT != null) lines.push(`- 血小板 ${v.PLT} ×10⁹/L（MAS 阈值 <181）`)
    if (v.AST != null) lines.push(`- AST ${v.AST} U/L（MAS 阈值 >48）`)
    if (v.FIB != null) lines.push(`- 纤维蛋白原 ${v.FIB} g/L（MAS 阈值 <3.6）`)
    if (v.TG != null) lines.push(`- 甘油三酯 ${v.TG} mmol/L（MAS 阈值 >1.76）`)
    if (v.LDH != null) lines.push(`- LDH ${v.LDH} U/L`)
    if (v.ESR != null) lines.push(`- 血沉 ${v.ESR} mm/h`)
  }
  if (context.subjective) {
    lines.push(`家长最近的主观记录："${context.subjective}"（仅供参考，不参与风险计算）`)
  }
  if (context.knowledge?.length) {
    lines.push('后端知识库参考：')
    context.knowledge.forEach((k) => lines.push(`- ${k.title}：${k.summary}${k.source ? `（来源：${k.source}）` : ''}`))
  }
  if (context.latestResearch?.length) {
    lines.push('最新研究/指南参考：')
    context.latestResearch.forEach((k) => lines.push(`- ${k.title}：${k.summary}`))
  }
  lines.push('回答要求：简明（3-5 句话）、结合上面的具体数值、给出明确行动建议。不要编造数据。')
  return lines.join('\n')
}

export const llmClient: LLMClient = {
  async ask(context) {
    // 通用 OpenAI 兼容格式，默认 Moonshot/Kimi，可切 DeepSeek 等
    const apiKey =
      (import.meta.env.VITE_LLM_API_KEY as string | undefined) ??
      (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined)
    const baseUrl =
      (import.meta.env.VITE_LLM_BASE_URL as string | undefined) ?? 'https://api.moonshot.cn/v1'
    const model = (import.meta.env.VITE_LLM_MODEL as string | undefined) ?? 'kimi-k3'

    if (!apiKey) {
      // 未配置 key 时用本地规则回答
      const { generateLocalAnswer } = await import('./llmAnswer')
      return generateLocalAnswer(context)
    }
    try {
      const latestResearch = await fetchLatestResearch()
      const knowledge = context.knowledge ?? (await knowledgeClient.search(context.question))
      const systemPrompt = buildSystemPrompt({ ...context, knowledge, latestResearch })
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context.question },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      })
      if (!res.ok) throw new Error(`LLM ${res.status}`)
      const data = await res.json()
      return data.choices?.[0]?.message?.content?.trim() ?? '（无回答）'
    } catch {
      const { generateLocalAnswer } = await import('./llmAnswer')
      return generateLocalAnswer(context)
    }
  },
}

export const consultClient: ConsultClient = {
  async request(data) {
    await delay(200)
    // TODO: 对接后端 POST /api/consult，返回医生聊天/问诊链接
    return { message: '线上问诊服务暂未接入，请稍后重试' }
  },
}
