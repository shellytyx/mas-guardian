import { useState } from 'react'
import { useStore } from '../lib/store'
import { RiskBar } from '../components/RiskBar'
import { RiskPositionChart } from '../components/RiskPositionChart'
import { SparkCard } from '../components/SparkCard'
import { LEVEL_META, lastFeverRunDays } from '../lib/engine'
import { IcoThermo, IcoClock, IcoCamera, IcoPencil, IcoCheck, IcoAlert, IcoChevron, HeartHero } from '../components/Ico'
import type { IndicatorKey } from '../types'

const TOP3: IndicatorKey[] = ['SF', 'PLT', 'AST']

export function Home() {
  const { patient, visits, checks, risk, navigate, addCheck } = useStore()
  const [tempInput, setTempInput] = useState<string | null>(null)
  const [tempVal, setTempVal] = useState('38.5')
  const [noteInput, setNoteInput] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  if (!risk || !patient) return <div className="page-loading">加载中…</div>

  const displayName = patient.name || '—'
  const sjiaLabel = patient.sjiaStatus === 'confirmed' ? '已确诊 sJIA' : patient.sjiaStatus === 'suspected' ? '疑似 sJIA' : '—'

  const latestVisit = [...visits].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const todayCheck = checks.find((c) => c.date === '2026-10-15')
  const lastLabDate = latestVisit?.date ?? '—'
  const daysSinceLab = latestVisit
    ? Math.round((new Date('2026-10-15').getTime() - new Date(latestVisit.date).getTime()) / 86400000)
    : 999
  const feverDays = lastFeverRunDays(checks)
  const stale = daysSinceLab > 30

  const subjective = [...checks].reverse().find((c) => c.subjective)?.subjective

  const mismatchTip =
    risk.level !== 'green' && subjective && /开心|好|不错|好玩/.test(subjective)

  const saveNote = async () => {
    if (!noteInput.trim()) return
    await addCheck({ ...todayCheck, date: '2026-10-15', subjective: noteInput.trim(), temp: todayCheck?.temp })
    setNoteSaved(true)
    setNoteInput('')
  }

  const saveTemp = async () => {
    const t = parseFloat(tempVal)
    if (!Number.isNaN(t)) {
      await addCheck({ ...todayCheck, date: '2026-10-15', temp: t, subjective: todayCheck?.subjective })
    }
    setTempInput(null)
  }

  return (
    <div className="page">
      <header className="home-header">
        <div>
          <div className="home-name">
            {displayName} · {patient.age}岁
          </div>
          <div className="home-dx">{sjiaLabel}</div>
        </div>
        <HeartHero className="home-hero-ico" />
      </header>

      <RiskBar
        level={stale && risk.level !== 'red' ? 'gray' : risk.level}
        headline={
          stale && risk.level !== 'red'
            ? `数据超过 ${daysSinceLab} 天未更新，预警可能不准确`
            : risk.headline
        }
        onClick={() => navigate({ name: 'alert' })}
      />

      <RiskPositionChart />

      <section className="spark-row">
        {TOP3.map((k) => (
          <SparkCard key={k} indicator={k} visits={visits} />
        ))}
      </section>

      {feverDays > 0 && (
        <div className="card warn-card">
          <span className="warn-ico"><IcoThermo size={22} /></span>
          <div>
            <div className="warn-title">已连续发热 {feverDays} 天</div>
            <div className="warn-sub">发热是需要记录的客观指标，用体温计测一下更准确</div>
          </div>
          <button className="btn-mini" onClick={() => setTempInput('open')}>
            记体温
          </button>
        </div>
      )}

      {!stale && daysSinceLab >= 14 && (
        <div className="card remind-card">
          <span className="remind-ico"><IcoClock size={20} /></span>
          <div>
            <div className="remind-title">距上次化验 {daysSinceLab} 天</div>
            <div className="remind-sub">按以往节奏该复查了（提醒可关闭，不强制）</div>
          </div>
        </div>
      )}

      <div className="action-row">
        <button className="btn-primary" onClick={() => navigate({ name: 'capture' })}>
          <span className="btn-ico"><IcoCamera size={19} /></span>拍化验单
        </button>
        <button className="btn-secondary" onClick={() => navigate({ name: 'entry' })}>
          <span className="btn-ico"><IcoPencil size={19} /></span>手动补录
        </button>
      </div>

      <div className="today-temp card">
        {todayCheck?.temp != null ? (
          <span>
            今日体温 <b>{todayCheck.temp}℃</b>
            <button className="btn-link" onClick={() => setTempInput('open')}>
              修改
            </button>
          </span>
        ) : (
          <span>
            今日体温 未记录
            <button className="btn-link" onClick={() => setTempInput('open')}>
              记一下 <IcoChevron size={13} />
            </button>
          </span>
        )}
      </div>

      <div className="note-input-area">
        <input
          className="note-input-field"
          placeholder="孩子今天说了什么、感觉怎么样…"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onFocus={() => setNoteSaved(false)}
        />
        <button className="note-save-btn" onClick={saveNote} disabled={!noteInput.trim()}>
          记录
        </button>
      </div>
      {subjective && (
        <div className="note-body">
          最近记录：{subjective}
        </div>
      )}
      {noteSaved && (
        <div className="note-saved-tip">
          <IcoCheck size={14} /> 已保存（仅供参考，不影响风险评估）
        </div>
      )}

      <button className="detail-link" onClick={() => navigate({ name: 'detail' })}>
        <IcoChevron size={14} /> 查看详细数据
      </button>

      {mismatchTip && (
        <div className="card mismatch-card" onClick={() => navigate({ name: 'alert' })}>
          <div className="mismatch-title"><IcoAlert size={16} /> 值得注意</div>
          <div className="mismatch-body">
            检验指标在恶化，但孩子近期感觉尚可——这类情况最容易被当成“没事”而延误，请仍以指标为准尽快就医。
          </div>
        </div>
      )}

      {tempInput && (
        <div className="modal-mask" onClick={() => setTempInput(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">今日体温</div>
            <input
              className="temp-input"
              type="number"
              step="0.1"
              value={tempVal}
              onChange={(e) => setTempVal(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setTempInput(null)}>
                取消
              </button>
              <button className="btn-primary" onClick={saveTemp}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
