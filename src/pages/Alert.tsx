import { useState } from 'react'
import { useStore } from '../lib/store'
import { RiskBar } from '../components/RiskBar'
import { evidenceOf } from '../lib/evidence'
import { LEVEL_META, proximityScore, riskBarPosition } from '../lib/engine'
import { IcoBack, IcoChevron, IcoCheck, IcoAlert, IcoInfo, IcoClose } from '../components/Ico'

export function Alert() {
  const { navigate, risk, checks, visits, patient, stageWarnings } = useStore()
  const [openRule, setOpenRule] = useState<string | null>(null)

  if (!risk) return <div className="page-loading">加载中…</div>

  const meta = LEVEL_META[risk.level as keyof typeof LEVEL_META]
  const subjective = [...checks].reverse().find((c) => c.subjective)?.subjective
  const mismatch = risk.level !== 'green' && subjective && /开心|好|不错|好玩/.test(subjective)
  const prox = proximityScore([...visits].sort((a, b) => a.date.localeCompare(b.date)).at(-1), checks, patient?.sjiaStatus)
  const barPos = riskBarPosition(risk.level, prox)

  const tips: string[] = []
  if (risk.level === 'red') {
    tips.push('立即联系主治医生或前往急诊，说明 MAS 风险')
    tips.push('就诊时携带：近 30 天化验单 + 本应用截图')
    tips.push('如孩子出现持续高热、出血点、嗜睡，不要等待')
  } else if (risk.level === 'orange') {
    tips.push('今天内联系主治医生，说明指标变化趋势')
    tips.push('每 4-6 小时测量并记录体温')
    tips.push('观察有无新出血点、瘀斑、精神变差')
  } else if (risk.level === 'yellow') {
    tips.push('近几天安排复查，对比指标趋势')
    tips.push('继续按计划记录体温和化验单')
    tips.push('如发热加重或出现新症状，提前就诊')
  } else {
    tips.push('按计划随访，有新化验单随时拍进来')
    tips.push('保持记录习惯，趋势比单次结果更重要')
  }

  const actions: string[] = []
  if (risk.level === 'red') {
    actions.push('今天就联系主治医生，说明指标变化')
    actions.push('如孩子出现持续高热、出血点、嗜睡，直接急诊')
    actions.push('就诊带上：近 30 天化验单 + 本页截图')
  } else if (risk.level === 'orange') {
    actions.push('今天内联系主治医生说明变化趋势')
    actions.push('记录每天体温，观察有无出血点')
    actions.push('就诊带上：近 30 天化验单 + 本页截图')
  } else if (risk.level === 'yellow') {
    actions.push('近几天安排复查，对比指标趋势')
    actions.push('继续按计划记录化验单')
  } else {
    actions.push('按计划随访，有新化验单随时拍进来')
  }

  return (
    <div className="page">
      <header className="page-head">
        <button className="back" onClick={() => navigate({ name: 'home' })}>
          <IcoBack size={15} /> 返回
        </button>
        <span>预警详情</span>
        <span className="alert-date">{risk.updatedAt}</span>
      </header>

      <RiskBar level={risk.level} score={barPos} headline={risk.headline} />

      {stageWarnings.length > 0 && (
        <section className="card">
          <div className="sec-title">分级预警</div>
          {stageWarnings.map((w, i) => (
            <div key={i} className={`stage-card stage-${w.stage}`}>
              <div className="stage-header">
                <span className="stage-badge">第{w.stage}级</span>
                <span className="stage-title">{w.title}</span>
              </div>
              <div className="stage-detail">{w.detail}</div>
              <div className="stage-suggestions">
                <div className="stage-suggestions-label">建议：</div>
                <ul>
                  {w.suggestions.map((s: string, j: number) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <div className="sec-title">为什么发出这个提醒</div>
        {risk.reasons.length === 0 ? (
          <div className="reason-none">当前没有触发任何预警规则。</div>
        ) : (
          <ul className="reason-list">
            {risk.reasons.map((r, i) => (
              <li key={i} className={`sev-${r.severity}`}>
                <span className="reason-mark">
                  {r.severity === 'red' ? <IcoClose size={16} /> : r.severity === 'orange' ? <IcoAlert size={16} /> : <IcoInfo size={16} />}
                </span>
                <div>
                  <div className="reason-text">{r.text}</div>
                  <button
                    className="cite-toggle"
                    onClick={() => setOpenRule(openRule === r.ruleId ? null : r.ruleId)}
                  >
                    {openRule === r.ruleId ? <>收起依据 <IcoChevron size={12} className="chev-down" /></> : <>查看依据 <IcoChevron size={12} /></>}
                  </button>
                  {openRule === r.ruleId && evidenceOf(r.ruleId) && (
                    <div className="cite-panel">
                      <div className="cite-title">{evidenceOf(r.ruleId)!.title}</div>
                      <div className="cite-quote">“{evidenceOf(r.ruleId)!.quote}”</div>
                      <div className="cite-src">— {evidenceOf(r.ruleId)!.source}</div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card score-card">
        <div className="sec-title">客观评分卡</div>
        <div className="score-grid">
          <div className={`score-item ${risk.criteria2016.met ? 'bad' : ''}`}>
            <div className="score-label">2016 分类标准</div>
            <div className="score-value">{risk.criteria2016.met ? '已满足' : '未满足'}</div>
            <div className="score-sub">
              铁蛋白{risk.criteria2016.ferritinOk ? <>684 以上 <IcoCheck size={13} /></> : '未超'} · 其他 {risk.criteria2016.hits.length}/4 项
            </div>
          </div>
          <div className={`score-item ${risk.msPositive ? 'bad' : ''}`}>
            <div className="score-label">MS 评分</div>
            <div className="score-value">{risk.msScore ?? '—'}</div>
            <div className="score-sub">临界 ≥ −2.1 {risk.msPositive ? '· 已超' : ''}</div>
          </div>
          <div className={`score-item ${(risk.ratios.ferEsr ?? 0) >= 21.5 ? 'warn' : ''}`}>
            <div className="score-label">铁蛋白/血沉</div>
            <div className="score-value">{risk.ratios.ferEsr ?? '—'}</div>
            <div className="score-sub">阈值 21.5</div>
          </div>
          <div className={`score-item ${(risk.ratios.ferPlt ?? 0) >= 1.1 ? 'warn' : ''}`}>
            <div className="score-label">铁蛋白/血小板</div>
            <div className="score-value">{risk.ratios.ferPlt ?? '—'}</div>
            <div className="score-sub">阈值 1.1</div>
          </div>
        </div>
      </section>

      {mismatch && (
        <div className="card mismatch-card">
          <div className="mismatch-title"><IcoAlert size={16} /> 值得注意</div>
          <div className="mismatch-body">
            检验指标在{meta.label === '高危' ? '持续恶化' : '恶化'}，但孩子近期感觉尚可（“{subjective}”）——这类情况最容易被当成“没事”而延误，请仍以指标为准尽快就医。
          </div>
        </div>
      )}

      <section className="card">
        <div className="sec-title">建议行动</div>
        <ol className="action-list">
          {actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
      </section>

      <section className="card">
        <div className="sec-title">风险接近度评分</div>
        <div className="prox-wrap">
          <div className="prox-ring">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={prox >= 80 ? '#dc2626' : prox >= 50 ? '#ea580c' : '#2563eb'}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34 * prox / 100} ${2 * Math.PI * 34}`}
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div className="prox-num">{prox}</div>
          </div>
          <div className="prox-info">
            <div className="prox-label">综合接近度</div>
            <div className="prox-sub">
              {prox >= 80 ? '高度接近 MAS 阈值，请立即就医' : prox >= 50 ? '正在逼近阈值，建议尽快联系医生' : '距离阈值尚远，继续监测'}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="sec-title">预防与下一步</div>
        <ul className="tips-list">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      <div className="disclaimer">
        本工具为辅助预警，不替代专业诊疗判断。所有依据来自公开共识与文献，点开"查看依据"可核对原文。
      </div>
    </div>
  )
}
