import { useState } from 'react'
import { useStore } from '../lib/store'
import { adviceFor, LEVEL_META, proximityScore } from '../lib/engine'
import { evidenceOf } from '../lib/evidence'
import { llmClient, consultClient } from '../lib/api'
import { IcoChevron, IcoAlert, IcoCheck, IcoInfo, IcoClose } from '../components/Ico'

export function Support() {
  const { navigate, risk, visits, checks, patient } = useStore()
  const [openRule, setOpenRule] = useState<string | null>(null)
  const [askInput, setAskInput] = useState('')
  const [chat, setChat] = useState<{ role: 'me' | 'ai'; text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [consultMsg, setConsultMsg] = useState<string | null>(null)

  const isLlmReady = Boolean(import.meta.env.VITE_LLM_API_KEY || import.meta.env.VITE_DEEPSEEK_API_KEY)

  if (!risk) return <div className="page-loading">加载中…</div>

  const meta = LEVEL_META[risk.level as keyof typeof LEVEL_META]
  const advice = adviceFor(risk.level)
  const prox = proximityScore([...visits].sort((a, b) => a.date.localeCompare(b.date)).at(-1), checks, patient?.sjiaStatus)

  const ask = async () => {
    const q = askInput.trim()
    if (!q || chatLoading) return
    setChat((c) => [...c, { role: 'me', text: q }])
    setAskInput('')
    setChatLoading(true)
    try {
      const answer = await llmClient.ask({
        question: q,
        risk,
        latestVisit: [...visits].sort((a, b) => a.date.localeCompare(b.date)).at(-1),
        subjective: [...checks].reverse().find((c) => c.subjective)?.subjective,
      })
      setChat((c) => [...c, { role: 'ai', text: answer }])
    } catch {
      setChat((c) => [...c, { role: 'ai', text: '回答生成失败，请稍后再试。' }])
    } finally {
      setChatLoading(false)
    }
  }

  const requestConsult = async () => {
    setConsultMsg('正在连接医生…')
    try {
      const res = await consultClient.request({
        reason: risk.headline,
        urgency: advice.urgency,
        snapshot: { level: risk.level, msScore: risk.msScore, criteria2016: risk.criteria2016 },
      })
      setConsultMsg(res.message + (res.url ? `，链接：${res.url}` : ''))
    } catch {
      setConsultMsg('连接失败，请稍后再试')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <span>决策支持</span>
      </header>

      <section className="card urgency-card">
        <div className="urgency-row">
          <span className="urgency-badge" style={{ background: meta.bg, color: meta.color }}>
            {advice.urgency}
          </span>
          <span className="urgency-level">{meta.label} · 要不要就医</span>
        </div>
        <div className="urgency-dept">
          建议就诊科室：<b>{advice.department}</b>
        </div>
        <button className="btn-consult" onClick={requestConsult} disabled={consultMsg !== null && consultMsg !== '正在连接医生…'}>
          线上问诊 · 联系医生
        </button>
        {consultMsg && (
          <div className="consult-msg">{consultMsg}</div>
        )}
      </section>

      <section className="card">
        <div className="sec-title">建议这样做</div>
        <ul className="action-list">
          {advice.actions.map((a, i) => (
            <li key={i}>
              <IcoCheck size={16} />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="sec-title">风险原因解释</div>
        {risk.reasons.length === 0 && <div className="empty-hint">暂无触发项，指标平稳</div>}
        {risk.reasons.map((r, i) => (
          <div key={i} className={`reason sev-${r.severity}`}>
            <div className="reason-head">
              {r.severity === 'red' ? <IcoClose size={16} /> : r.severity === 'orange' ? <IcoAlert size={16} /> : <IcoInfo size={16} />}
              <span className="reason-text">{r.text}</span>
            </div>
            {evidenceOf(r.ruleId) && (
              <>
                <button className="reason-more" onClick={() => setOpenRule(openRule === r.ruleId ? null : r.ruleId)}>
                  {openRule === r.ruleId ? <>收起依据 <IcoChevron size={12} className="chev-down" /></> : <>查看依据 <IcoChevron size={12} /></>}
                </button>
                {openRule === r.ruleId && (
                  <div className="evidence">
                    <div className="evidence-src">{evidenceOf(r.ruleId)!.title}</div>
                    <div className="evidence-claim">{evidenceOf(r.ruleId)!.quote}</div>
                    <div className="evidence-src" style={{ marginTop: 6 }}>{evidenceOf(r.ruleId)!.source}</div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </section>

      <section className="card">
        <div className="sec-title">AI 问一问 {isLlmReady ? <span className="mode-tag live">Kimi K3</span> : <span className="mode-tag local">本地规则</span>}</div>
        {!isLlmReady && (
          <div className="ai-hint" style={{ marginBottom: 8 }}>
            <IcoInfo size={14} /> 当前为本地规则回答。配置 VITE_LLM_API_KEY 后即可启用 Kimi K3。
          </div>
        )}
        <div className="ai-box">
          {chat.length === 0 && (
            <div className="ai-hint">
              <IcoInfo size={14} /> 试试问：“现在需要去医院吗？”“铁蛋白 700 严重吗？”
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>
              {m.text}
            </div>
          ))}
          {chatLoading && (
            <div className="ai-msg ai">正在结合你的指标和预警等级思考…</div>
          )}
        </div>
        <div className="ai-disclaimer">AI 建议仅供参考，具体诊疗请遵医嘱。</div>
        <div className="ai-input-row">
          <input
            className="note-input-field"
            placeholder="问问指标、预警或就医建议…"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button className="note-save-btn" onClick={ask} disabled={!askInput.trim()}>
            发送
          </button>
        </div>
      </section>

      <section className="card">
        <div className="sec-title">评分明细</div>
        <div className="score-row">
          <div className="score-cell">
            <div className="score-label">接近度</div>
            <div className="score-value" style={{ color: meta.color }}>{prox}%</div>
            <div className="score-sub">距 MAS 阈值</div>
          </div>
          <div className="score-cell">
            <div className="score-label">2016 标准</div>
            <div className="score-value" style={{ color: risk.criteria2016.met ? 'var(--red)' : 'var(--ink)' }}>
              {risk.criteria2016.met ? '已满足' : '未满足'}
            </div>
            <div className="score-sub">铁蛋白684以上 {risk.criteria2016.ferritinOk ? '✓' : ''} · 其他 {risk.criteria2016.hits.length}/4 项</div>
          </div>
          <div className="score-cell">
            <div className="score-label">MS 评分</div>
            <div className="score-value" style={{ color: risk.msPositive ? 'var(--red)' : 'var(--ink)' }}>
              {risk.msScore ?? '—'}
            </div>
            <div className="score-sub">临界 ≥ −2.1{risk.msPositive ? ' · 已超' : ''}</div>
          </div>
        </div>
        <button className="detail-link" onClick={() => navigate({ name: 'alert' })}>
          <IcoChevron size={14} /> 查看完整预警详情
        </button>
      </section>
    </div>
  )
}
