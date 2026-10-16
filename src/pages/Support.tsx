import { useState } from 'react'
import { useStore } from '../lib/store'
import { adviceFor, LEVEL_META, proximityScore } from '../lib/engine'
import { evidenceOf } from '../lib/evidence'
import { IcoChevron, IcoAlert, IcoCheck, IcoInfo, IcoClose } from '../components/Ico'

const AI_REPLIES: Record<string, string> = {
  default:
    '我理解你的担心。请以应用里的客观指标和预警分级为准：如果达到橙色或红色，请今天内联系主治医生。也可以把化验单拍下来，让我帮你看看指标趋势。',
}

export function Support() {
  const { navigate, risk, visits, checks, patient } = useStore()
  const [openRule, setOpenRule] = useState<string | null>(null)
  const [askInput, setAskInput] = useState('')
  const [chat, setChat] = useState<{ role: 'me' | 'ai'; text: string }[]>([])
  const [consultDone, setConsultDone] = useState(false)

  if (!risk) return <div className="page-loading">加载中…</div>

  const meta = LEVEL_META[risk.level as keyof typeof LEVEL_META]
  const advice = adviceFor(risk.level)
  const prox = proximityScore([...visits].sort((a, b) => a.date.localeCompare(b.date)).at(-1), checks, patient?.sjiaStatus)

  const ask = () => {
    const q = askInput.trim()
    if (!q) return
    setChat((c) => [...c, { role: 'me', text: q }, { role: 'ai', text: AI_REPLIES.default }])
    setAskInput('')
  }

  return (
    <div className="page">
      <header className="page-head">
        <span>决策支持</span>
      </header>

      <section className="card urgency-card" style={{ borderLeft: `5px solid ${meta.color}` }}>
        <div className="urgency-row">
          <span className="urgency-badge" style={{ background: meta.bg, color: meta.color }}>
            {advice.urgency}
          </span>
          <span className="urgency-level">{meta.label} · 要不要就医</span>
        </div>
        <div className="urgency-dept">
          建议就诊科室：<b>{advice.department}</b>
        </div>
        <button className="btn-consult" onClick={() => setConsultDone(true)}>
          线上问诊 · 联系医生{consultDone ? '（接入后端后开放）' : ''}
        </button>
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
        <div className="sec-title">AI 问一问</div>
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
        </div>
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
