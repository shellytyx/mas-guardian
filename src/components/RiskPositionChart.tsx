import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { EChart } from './EChart'
import type { IndicatorKey } from '../types'
import { INDICATORS } from '../types'
import type { EChartsOption } from 'echarts'

interface AxisItem {
  key: IndicatorKey
  label: string
  safe: number
  mas: number
  unit: string
}

const AXIS: AxisItem[] = [
  { key: 'SF',  label: '铁蛋白',     safe: 100, mas: 684, unit: 'ng/mL' },
  { key: 'PLT', label: '血小板',     safe: 200, mas: 181, unit: '×10⁹/L' },
  { key: 'AST', label: 'AST',        safe: 40,  mas: 48,  unit: 'U/L' },
  { key: 'FIB', label: '纤维蛋白原', safe: 4.0, mas: 3.6, unit: 'g/L' },
  { key: 'TG',  label: '甘油三酯',   safe: 1.7, mas: 1.76, unit: 'mmol/L' },
  { key: 'LDH', label: 'LDH',        safe: 345, mas: 882, unit: 'U/L' },
]

function isOverMas(v: number, a: AxisItem): boolean {
  const badUp = INDICATORS[a.key].badDirection === 'up'
  return badUp ? v > a.mas : v < a.mas
}

function isBelowSafe(v: number, a: AxisItem): boolean {
  const badUp = INDICATORS[a.key].badDirection === 'up'
  return badUp ? v < a.safe : v > a.safe
}

export function RiskPositionChart() {
  const { visits } = useStore()

  const latest = useMemo(() => {
    const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.reverse().find((v) => Object.keys(v.values).length > 0) ?? sorted.at(-1)
  }, [visits])

  const { actual, overCount, nearCount } = useMemo(() => {
    const pts = AXIS.map((a) => {
      const v = latest?.values[a.key]
      return { ...a, raw: v ?? null }
    })
    const over = pts.filter((p) => p.raw != null && isOverMas(p.raw, p)).length
    const near = pts.filter(
      (p) => p.raw != null && !isOverMas(p.raw, p) && !isBelowSafe(p.raw, p),
    ).length
    return { actual: pts, overCount: over, nearCount: near }
  }, [latest])

  const option: EChartsOption = useMemo(() => {
    const labels = AXIS.map((a) => a.label)
    return {
      animationDuration: 600,
      grid: { left: 10, right: 14, top: 34, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const arr = Array.isArray(params) ? params : [params]
          const i = arr[0].dataIndex
          const a = AXIS[i]
          const raw = actual[i].raw
          if (raw == null) return `${a.label}<br/>本次未测<br/>预期值 ${a.safe} · MAS 阈值 ${a.mas} ${a.unit}`
          const over = isOverMas(raw, a)
          const below = isBelowSafe(raw, a)
          const state = over
            ? '<b style="color:#dc2626">已越过 MAS 阈值线</b>'
            : below
              ? '<b style="color:#16a34a">处于预期安全区</b>'
              : '<b style="color:#ca8a04">在预期值与 MAS 阈值之间</b>'
          return `${a.label}<br/>本次实测：<b>${raw}</b> ${a.unit}<br/>预期值：${a.safe} · MAS 阈值：${a.mas}<br/>${state}`
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          interval: 0,
          formatter: (_value: string, idx: number) => {
            const a = AXIS[idx]
            return `{n|${a.label}}\n{r|${a.safe} ~ ${a.mas} ${a.unit}}`
          },
          rich: {
            n: { fontSize: 11, color: '#334155', fontWeight: 600, align: 'center', padding: [0, 0, 3, 0] },
            r: { fontSize: 8.5, color: '#94a3b8', align: 'center' },
          },
        },
      },
      yAxis: {
        type: 'log',
        min: 1,
        max: 1000,
        show: false,
      },
      series: [
        {
          name: '预期值',
          type: 'line',
          data: AXIS.map((a) => a.safe),
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#16a34a', width: 2, type: 'dashed' },
          label: {
            show: true,
            position: 'bottom',
            fontSize: 9,
            color: '#16a34a',
            fontWeight: 600,
            formatter: (p: any) => `${p.value}`,
          },
        },
        {
          name: 'MAS 阈值',
          type: 'line',
          data: AXIS.map((a) => a.mas),
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#dc2626', width: 2, type: 'dashed' },
          label: {
            show: true,
            position: 'top',
            fontSize: 9,
            color: '#dc2626',
            fontWeight: 600,
            formatter: (p: any) => `${p.value}`,
          },
        },
        {
          name: '实际值',
          type: 'line',
          data: actual.map((p) => ({
            value: p.raw,
            itemStyle: {
              color: p.raw == null ? '#cbd5e1' : isOverMas(p.raw, p) ? '#dc2626' : '#2563eb',
            },
          })),
          symbol: 'circle',
          symbolSize: 9,
          connectNulls: true,
          lineStyle: { color: '#2563eb', width: 2.5 },
          itemStyle: { color: '#2563eb', borderWidth: 2, borderColor: '#fff' },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            fontWeight: 700,
            color: '#2563eb',
            formatter: (p: any) => {
              if (p.value == null) return ''
              const a = AXIS[p.dataIndex]
              return isOverMas(p.value, a) ? `${p.value} ↑` : `${p.value}`
            },
          },
        },
      ],
    }
  }, [actual])

  const summary =
    overCount > 0
      ? `${AXIS.length} 项关键指标中，${overCount} 项已越过 MAS 阈值线`
      : nearCount > 0
        ? `${nearCount} 项指标在预期值与 MAS 阈值之间，需密切关注`
        : '各项指标均在预期安全区'

  return (
    <div className="card pos-chart-card">
      <div className="pos-chart-title">风险定位图 · 实际值离哪条线更近</div>
      <EChart option={option} height={220} />
      <div className="pos-chart-legend">
        <span className="pl lg-green">━ 预期值</span>
        <span className="pl lg-red">━ MAS 阈值</span>
        <span className="pl lg-blue">━ 实际值</span>
      </div>
      <div className={`pos-chart-summary ${overCount > 0 ? 'bad' : ''}`}>{summary}</div>
    </div>
  )
}
