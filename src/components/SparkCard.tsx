import { useMemo } from 'react'
import type { IndicatorKey, LabVisit } from '../types'
import { INDICATORS } from '../types'
import { trendBadge } from '../lib/engine'
import { TrendBadge } from './TrendBadge'
import { EChart } from './EChart'
import type { EChartsOption } from 'echarts'

interface Props {
  indicator: IndicatorKey
  visits: LabVisit[]
}

export function SparkCard({ indicator, visits }: Props) {
  const meta = INDICATORS[indicator]
  const sorted = useMemo(
    () => [...visits].sort((a, b) => a.date.localeCompare(b.date)),
    [visits],
  )
  const points = sorted.filter((v) => v.values[indicator] != null)
  const latest = points.at(-1)?.values[indicator]
  const prev = points.at(-2)?.values[indicator]
  const badge = trendBadge(latest, prev, meta.badDirection)

  const option: EChartsOption = useMemo(
    () => ({
      animation: false,
      grid: { left: 4, right: 4, top: 8, bottom: 4 },
      xAxis: {
        type: 'category',
        show: false,
        data: points.map((p) => p.date),
        boundaryGap: false,
      },
      yAxis: { type: 'value', show: false, scale: true },
      tooltip: { show: false },
      series: [
        {
          type: 'line',
          data: points.map((p) => p.values[indicator]),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2, color: meta.badDirection === 'up' ? '#2563eb' : '#2563eb' },
          itemStyle: { color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37,99,235,0.18)' },
                { offset: 1, color: 'rgba(37,99,235,0)' },
              ],
            },
          },
        },
      ],
    }),
    [points, indicator, meta],
  )

  const delta =
    latest != null && prev != null && prev !== 0
      ? Math.round(((latest - prev) / prev) * 100)
      : null

  return (
    <div className="spark-card">
      <div className="spark-head">
        <span className="spark-name">{meta.name}</span>
        <TrendBadge text={badge.text} tone={badge.tone} />
      </div>
      <div className="spark-value">
        {latest ?? '—'}
        <span className="spark-unit">{meta.unit}</span>
      </div>
      <EChart option={option} height={52} />
      <div className="spark-delta">
        {delta != null ? `较上次 ${delta > 0 ? '+' : ''}${delta}%` : '暂无对比'}
      </div>
    </div>
  )
}
