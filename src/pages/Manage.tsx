import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { computeRisk, LEVEL_META } from '../lib/engine'
import { IcoCamera, IcoPencil, IcoChevron, IcoClock, IcoCheck, IcoPhoto } from '../components/Ico'

export function Manage() {
  const { navigate, visits, checks, patient, resetDemo } = useStore()

  const sorted = useMemo(() => [...visits].sort((a, b) => a.date.localeCompare(b.date)), [visits])

  const alertHistory = useMemo(() => {
    return sorted.map((_, i) => {
      const prefix = sorted.slice(0, i + 1)
      const r = computeRisk(prefix, checks, patient?.sjiaStatus)
      return { date: prefix.at(-1)!.date, level: r.level, headline: r.headline }
    })
  }, [sorted, checks, patient])

  const lastLab = sorted.at(-1)
  const daysSinceLab = lastLab
    ? Math.round((new Date('2026-10-15').getTime() - new Date(lastLab.date).getTime()) / 86400000)
    : 999

  return (
    <div className="page">
      <header className="page-head">
        <span>连续管理</span>
      </header>

      <section className="action-row">
        <button className="btn-primary" onClick={() => navigate({ name: 'capture' })}>
          <span className="btn-ico"><IcoCamera size={19} /></span>拍化验单
        </button>
        <button className="btn-secondary" onClick={() => navigate({ name: 'entry' })}>
          <span className="btn-ico"><IcoPencil size={19} /></span>手动补录
        </button>
      </section>

      <div className="card remind-card">
        <span className="remind-ico"><IcoClock size={20} /></span>
        <div>
          <div className="remind-title">距上次化验 {daysSinceLab} 天</div>
          <div className="remind-sub">随访复诊提醒：按以往节奏该复查了（可关闭，不强制）</div>
        </div>
      </div>

      <section className="card">
        <div className="sec-title">指标折线图</div>
        <button className="nav-row" onClick={() => navigate({ name: 'detail' })}>
          <span className="nav-row-ico"><IcoChartMini /></span>
          <span className="nav-row-text">
            <b>全部指标趋势</b>
            <small>7 项指标时间线 · 支持 7/30 天与全部切换</small>
          </span>
          <IcoChevron size={15} />
        </button>
      </section>

      <section className="card">
        <div className="sec-title">历史记录 · {sorted.length} 次</div>
        {sorted.length === 0 && <div className="empty-hint">还没有记录，先拍一张化验单</div>}
        <div className="history-list">
          {[...sorted].reverse().map((v) => (
            <div key={v.id} className="history-item" onClick={() => navigate({ name: 'detail' })}>
              <span className="history-date">{v.date}</span>
              <span className="history-src">
                {v.rawPhoto ? <IcoPhoto size={14} /> : '手动'}
              </span>
              <span className="history-vals">
                铁蛋白 {v.values.SF ?? '—'} · 血小板 {v.values.PLT ?? '—'}
              </span>
              <IcoChevron size={14} />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="sec-title">预警历史</div>
        <div className="history-list">
          {[...alertHistory].reverse().map((a, i) => {
            const m = LEVEL_META[a.level as keyof typeof LEVEL_META]
            return (
              <div key={i} className="history-item" onClick={() => navigate({ name: 'alert' })}>
                <span className="history-date">{a.date}</span>
                <span className="alert-dot" style={{ background: m?.bg, color: m?.color }}>
                  {m?.label ?? '—'}
                </span>
                <span className="history-vals">{a.headline}</span>
                <IcoChevron size={14} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="card privacy-card">
        <div className="sec-title"><IcoCheck size={15} /> 隐私保护</div>
        <div className="privacy-body">
          所有化验单、体温和备注仅保存在本机浏览器，不上传服务器。接入后端后将采用加密传输，且可随时一键导出或删除全部数据。
        </div>
        <button
          className="btn-danger-ghost"
          onClick={() => {
            if (window.confirm('确定要清除本机全部数据和档案吗？此操作不可恢复。')) {
              resetDemo()
            }
          }}
        >
          清除本机数据并重置演示
        </button>
      </section>
    </div>
  )
}

function IcoChartMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 17l5-5 3.5 3L20 7" stroke="#4a7cf0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="12" r="2" fill="#ff8a8a" />
      <circle cx="12.5" cy="15" r="2" fill="#6c9cf5" />
    </svg>
  )
}
