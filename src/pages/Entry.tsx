import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { INDICATORS } from '../types'
import type { IndicatorKey } from '../types'
import { today } from '../data/mock'
import { IcoBack, IcoAlert, IcoCheck, IcoChevron } from '../components/Ico'

const PACKAGES: Record<string, IndicatorKey[]> = {
  小套: ['SF', 'PLT', 'AST', 'FIB'],
  大套: ['SF', 'PLT', 'AST', 'ALT', 'FIB', 'TG', 'LDH', 'ESR', 'WBC'],
}

export function Entry() {
  const { navigate, visits, addVisit } = useStore()
  const [pkg, setPkg] = useState<keyof typeof PACKAGES>('小套')
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<Partial<Record<IndicatorKey, number>>>({})
  const [saving, setSaving] = useState(false)

  const lastVisit = [...visits].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const keys = PACKAGES[pkg]
  const current = keys[idx]
  const meta = INDICATORS[current]

  const lastVal = lastVisit?.values[current]
  const curVal = draft[current] ?? lastVal ?? 0

  const deltaPct =
    lastVal != null && lastVal !== 0 ? Math.round(((curVal - lastVal) / lastVal) * 100) : null

  const worse =
    deltaPct != null &&
    Math.abs(deltaPct) >= 10 &&
    (meta.badDirection === 'up' ? deltaPct > 0 : deltaPct < 0)

  const [confirmBad, setConfirmBad] = useState(false)

  const commit = (v: number) => {
    if (lastVal != null && lastVal !== 0) {
      const ratio = Math.abs(v) / lastVal
      if (ratio < 0.1 || ratio > 10) {
        setDraft((d) => ({ ...d, [current]: v }))
        setConfirmBad(true)
        return
      }
    }
    setDraft((d) => ({ ...d, [current]: v }))
  }

  const next = () => {
    if (idx < keys.length - 1) setIdx(idx + 1)
    else finish()
  }

  const finish = async () => {
    setSaving(true)
    const values: Partial<Record<IndicatorKey, number>> = { ...draft }
    keys.forEach((k) => {
      if (values[k] == null && lastVisit?.values[k] != null) delete values[k]
    })
    await addVisit({ date: today, values, source: 'manual', verified: false })
    navigate({ name: 'home' })
  }

  const filled = keys.filter((k) => draft[k] != null).length

  return (
    <div className="page">
      <header className="page-head">
        <button className="back" onClick={() => (idx > 0 ? setIdx(idx - 1) : navigate({ name: 'home' }))}>
          <IcoBack size={15} /> 返回
        </button>
        <span>手动补录</span>
        <span className="pkg-progress">
          {idx + 1} / {keys.length}
        </span>
      </header>

      <div className="pkg-switch">
        {(Object.keys(PACKAGES) as Array<keyof typeof PACKAGES>).map((p) => (
          <button
            key={p}
            className={`chip ${pkg === p ? 'active' : ''}`}
            onClick={() => {
              setPkg(p)
              setIdx(0)
            }}
          >
            {p}（{PACKAGES[p].length}项）
          </button>
        ))}
        <span className="pkg-filled">已填 {filled}</span>
      </div>

      <div className="wizard card">
        <div className="wz-name">
          {meta.name} <span className="wz-unit">{meta.unit}</span>
        </div>
        <div className="wz-ref">
          参考区间 {meta.refLow} – {meta.refHigh}
        </div>
        <div className="wz-last">
          上次（{lastVisit?.date ?? '—'}）：{lastVal ?? '无记录'} → 本次
        </div>
        <div className="wz-value" onClick={() => {}}>
          {curVal}
        </div>
        <div className="wz-steppers">
          <div className="step-row">
            <button className="step" onClick={() => commit(curVal - 10)}>−10</button>
            <button className="step" onClick={() => commit(curVal + 10)}>+10</button>
          </div>
          <div className="step-row">
            <button className="step" onClick={() => commit(curVal - 1)}>−1</button>
            <input
              className="wz-input"
              inputMode="decimal"
              value={curVal}
              onChange={(e) => commit(Number(e.target.value))}
            />
            <button className="step" onClick={() => commit(curVal + 1)}>+1</button>
          </div>
        </div>
        {deltaPct != null && Math.abs(deltaPct) >= 10 && (
          <div className={`wz-delta ${worse ? 'bad' : 'good'}`}>
            {worse ? <IcoAlert size={14} /> : <IcoCheck size={14} />}
            比上次{meta.badDirection === 'up' ? (deltaPct > 0 ? '升高' : '降低') : deltaPct > 0 ? '升高' : '降低'}{' '}
            {Math.abs(deltaPct)}%
          </div>
        )}
      </div>

      <div className="capture-actions">
        <button className="btn-secondary" onClick={() => setDraft((d) => ({ ...d, [current]: undefined }))}>
          本次未测，跳过
        </button>
        <button className="btn-primary btn-big" onClick={next}>
          {idx < keys.length - 1 ? <>下一项 <IcoChevron size={14} /></> : saving ? '保存中…' : '完成，查看风险'}
        </button>
      </div>

      {confirmBad && (
        <div className="modal-mask" onClick={() => setConfirmBad(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认一下</div>
            <div className="modal-body">
              上次是 <b>{lastVal}</b>，这次输入的是 <b>{draft[current]}</b>，相差一个数量级——确认没输错吗？
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmBad(false)}>
                再改改
              </button>
              <button className="btn-primary" onClick={() => setConfirmBad(false)}>
                确认正确
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
