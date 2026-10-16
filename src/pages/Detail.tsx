import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { EChart } from '../components/EChart'
import { TrendBadge } from '../components/TrendBadge'
import { INDICATORS } from '../types'
import type { EChartsOption } from 'echarts'
import { IcoBack, IcoPhoto } from '../components/Ico'

type Range = 7 | 30 | 9999

const GROUP = 'detail-lanes'

export function Detail() {
  const { navigate, visits, checks } = useStore()
  const [range, setRange] = useState<Range>(30)

  const sorted = useMemo(
    () => [...visits].sort((a, b) => a.date.localeCompare(b.date)),
    [visits],
  )

  const cutoff = new Date('2026-10-15').getTime() - range * 86400000
  const shown = sorted.filter((v) => new Date(v.date).getTime() >= cutoff)
  const dates = shown.map((v) => v.date.slice(5).replace('-', '/'))
  const prevVisit = sorted[sorted.length - 2]

  const feverDates = new Set(checks.filter((c) => (c.temp ?? 0) >= 37.5).map((c) => c.date.slice(5).replace('-', '/')))

  const lanes = (['SF', 'PLT', 'AST', 'FIB', 'TG', 'LDH', 'ESR'] as const).filter((k) =>
    shown.some((v) => v.values[k] != null),
  )

  const markLines = {
    silent: true,
    lineStyle: { type: 'dashed' as const, color: '#f59e0b' },
    label: { show: true, position: 'insideEndTop' as const, fontSize: 9, color: '#b45309' },
    data: [],
  }

  return (
    <div className="page">
      <header className="page-head">
        <button className="back" onClick={() => navigate({ name: 'home' })}>
          <IcoBack size={15} /> 返回
        </button>
        <span>详细数据</span>
        <span className="range-switch">
          {([7, 30, 9999] as Range[]).map((r) => (
            <button
              key={r}
              className={`chip ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 7 ? '7天' : r === 30 ? '30天' : '全部'}
            </button>
          ))}
        </span>
      </header>

      <div className="legend card">
        <span className="lg febrile">🟦 发热期</span>
        <span className="lg">● 化验记录</span>
        <span className="lg">虚线 = 关键阈值</span>
        <span className="lg dim">所有泳道方向为指标真实方向</span>
      </div>

      {lanes.map((k) => {
        const meta = INDICATORS[k]
        const latest = [...shown].reverse().find((v) => v.values[k] != null)?.values[k]
        const prev = prevVisit?.values[k]
        const change =
          latest != null && prev != null && prev !== 0
            ? Math.round(((latest - prev) / prev) * 100)
            : null
        const worse =
          change != null && Math.abs(change) >= 5 && (meta.badDirection === 'up' ? change > 0 : change < 0)
        const badge =
          change == null || Math.abs(change) < 5
            ? { text: '→ 平稳', tone: 'flat' as const }
            : {
                text: `${change > 0 ? '↗' : '↘'} ${Math.abs(change)}%`,
                tone: worse ? ('bad' as const) : ('good' as const),
              }

        const seriesData = shown.map((v) => v.values[k] ?? null)
        const threshold =
          k === 'SF' ? 684 : k === 'PLT' ? 181 : k === 'AST' ? 48 : k === 'FIB' ? 3.6 : k === 'TG' ? 1.76 : null

        const option: EChartsOption = {
          animationDuration: 400,
          grid: { left: 44, right: 12, top: 16, bottom: 26 },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', link: [{ xAxisIndex: 'all' }] },
            formatter: (params: any) => {
              const p = Array.isArray(params) ? params[0] : params
              return `${p.axisValue}<br/>${meta.name}: <b>${p.value ?? '—'}</b> ${meta.unit}`
            },
          },
          xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { fontSize: 9, color: '#94a3b8' },
            axisPointer: { label: { show: false } },
          },
          yAxis: {
            type: 'value',
            scale: true,
            splitLine: { lineStyle: { color: '#f1f5f9' } },
            axisLabel: { fontSize: 9, color: '#94a3b8' },
          },
          series: [
            {
              name: meta.name,
              type: 'line',
              data: seriesData,
              smooth: true,
              symbolSize: 6,
              connectNulls: true,
              lineStyle: { width: 2.5, color: '#2563eb' },
              itemStyle: { color: '#2563eb' },
              markLine:
                threshold != null
                  ? {
                      ...markLines,
                      data: [{ yAxis: threshold, label: { ...markLines.label, formatter: String(threshold) } }],
                    }
                  : undefined,
              areaStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(37,99,235,0.12)' },
                    { offset: 1, color: 'rgba(37,99,235,0)' },
                  ],
                },
              },
              markArea:
                feverDates.size > 0
                  ? {
                      itemStyle: { color: 'rgba(59,130,246,0.08)' },
                      data: dates
                        .map((d, i) =>
                          feverDates.has(d)
                            ? [{ xAxis: d }, { xAxis: dates[Math.min(i + 1, dates.length - 1)] }]
                            : null,
                        )
                        .filter(Boolean) as any,
                    }
                  : undefined,
            },
          ],
        }

        return (
          <div key={k} className="lane card">
            <div className="lane-head">
              <span className="lane-name">
                {meta.name} <span className="lane-unit">{meta.unit}</span>
              </span>
              <span className="lane-latest">{latest ?? '—'}</span>
              <TrendBadge text={badge.text} tone={badge.tone} />
            </div>
            <EChart option={option} height={150} group={GROUP} />
          </div>
        )
      })}

      <details className="note-strip card">
        <summary>家长补充记录（主观描述，仅供医生参考）</summary>
        <div className="note-body">
          {checks
            .filter((c) => c.subjective)
            .map((c) => (
              <div key={c.date}>
                {c.date}：{c.subjective}
              </div>
            )) || '暂无'}
        </div>
      </details>

      <details className="note-strip card">
        <summary>最近一次化验的原始单据存档</summary>
        <div className="note-body">
          {sorted.at(-1)?.rawPhoto ? (
            <span className="photo-arch"><IcoPhoto size={15} /> 有原图存档（接入后端后可点击查看）</span>
          ) : (
            '本条为手动录入，无原图'
          )}
        </div>
      </details>
    </div>
  )
}
