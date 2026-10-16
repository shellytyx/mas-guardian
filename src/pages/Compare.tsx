import { useStore } from '../lib/store'
import { RiskPositionChart } from '../components/RiskPositionChart'
import { EChart } from '../components/EChart'
import { LEVEL_META, proximityScore, lastFeverRunDays } from '../lib/engine'
import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

export function Compare() {
  const { navigate, risk, visits, checks, patient } = useStore()
  const sorted = useMemo(() => [...visits].sort((a, b) => a.date.localeCompare(b.date)), [visits])
  const latest = sorted.at(-1)
  const prev = sorted.at(-2)
  const prox = proximityScore(latest, checks, patient?.sjiaStatus)
  const meta = risk ? LEVEL_META[risk.level as keyof typeof LEVEL_META] : null

  const sfTrend: EChartsOption = useMemo(() => {
    const dates = sorted.map((v) => v.date.slice(5).replace('-', '/'))
    const sfData = sorted.map((v) => v.values.SF ?? null)
    return {
      grid: { left: 40, right: 16, top: 20, bottom: 28 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [{ type: 'line', data: sfData, smooth: true, lineStyle: { width: 2, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, areaStyle: { color: 'rgba(37,99,235,0.08)' } }],
    }
  }, [sorted])

  const pltTrend: EChartsOption = useMemo(() => {
    const dates = sorted.map((v) => v.date.slice(5).replace('-', '/'))
    const data = sorted.map((v) => v.values.PLT ?? null)
    return {
      grid: { left: 40, right: 16, top: 20, bottom: 28 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [{ type: 'line', data, smooth: true, lineStyle: { width: 2, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, areaStyle: { color: 'rgba(37,99,235,0.08)' } }],
    }
  }, [sorted])

  const feverDays = lastFeverRunDays(checks)

  return (
    <div className="compare-page">
      <header className="compare-header">
        <button className="back-btn" onClick={() => navigate({ name: 'home' })}>← 返回</button>
        <span className="compare-title">风格对比 · 队友模板</span>
      </header>

      <div className="compare-body">
        <div className="compare-patient">
          <span className="compare-name">{patient?.name || '—'}</span>
          <span className="compare-meta">{patient?.age}岁 · {patient?.sjiaStatus === 'confirmed' ? '已确诊 sJIA' : patient?.sjiaStatus === 'suspected' ? '疑似 sJIA' : '—'}</span>
        </div>

        {risk && meta && (
          <div className="compare-risk">
            <div className="compare-risk-bar">
              <div className="riskbar-track">
                <div className="riskbar-cursor" style={{ left: `${risk.level === 'green' ? 8 : risk.level === 'yellow' ? 36 : risk.level === 'orange' ? 64 : 90}%` }}>
                  <span className="riskbar-dot" />
                </div>
              </div>
              <div className="compare-risk-info">
                <span className="compare-risk-level" style={{ color: meta.color }}>{meta.label}</span>
                <span className="compare-risk-headline">{risk.headline}</span>
              </div>
            </div>
          </div>
        )}

        <div className="compare-grid">
          <div className="compare-card">
            <div className="compare-card-label">综合接近度</div>
            <div className="compare-prox-ring">
              <svg viewBox="0 0 80 80" width="72" height="72">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={prox >= 80 ? '#dc2626' : prox >= 50 ? '#ea580c' : '#2563eb'} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34 * prox / 100} ${2 * Math.PI * 34}`} transform="rotate(-90 40 40)" />
              </svg>
              <div className="compare-prox-num">{prox}</div>
            </div>
            <div className="compare-prox-label">{prox >= 80 ? '高度接近阈值' : prox >= 50 ? '正在逼近阈值' : '距离阈值尚远'}</div>
          </div>

          <div className="compare-card">
            <div className="compare-card-label">连续发热</div>
            <div className="compare-fever-num">{feverDays}</div>
            <div className="compare-fever-label">天</div>
          </div>

          <div className="compare-card">
            <div className="compare-card-label">MS 评分</div>
            <div className="compare-ms-num">{risk?.msScore ?? '—'}</div>
            <div className="compare-ms-label">临界 ≥ −2.1</div>
          </div>
        </div>

        <div className="compare-section">
          <h3 className="compare-section-title">风险定位图</h3>
          <RiskPositionChart />
        </div>

        <div className="compare-section">
          <h3 className="compare-section-title">关键趋势</h3>
          <div className="compare-trends">
            <div className="compare-trend-card">
              <div className="compare-trend-label">铁蛋白</div>
              <EChart option={sfTrend} height={90} />
            </div>
            <div className="compare-trend-card">
              <div className="compare-trend-label">血小板</div>
              <EChart option={pltTrend} height={90} />
            </div>
          </div>
        </div>

        {risk && (
          <div className="compare-section">
            <h3 className="compare-section-title">预防与下一步</h3>
            <ul className="compare-tips">
              {risk.level === 'red' && <><li>立即联系主治医生或前往急诊</li><li>就诊时携带：近 30 天化验单 + 本应用截图</li><li>如孩子出现持续高热、出血点、嗜睡，不要等待</li></>}
              {risk.level === 'orange' && <><li>今天内联系主治医生，说明指标变化趋势</li><li>每 4-6 小时测量并记录体温</li><li>观察有无新出血点、瘀斑、精神变差</li></>}
              {risk.level === 'yellow' && <><li>近几天安排复查，对比指标趋势</li><li>继续按计划记录体温和化验单</li><li>如发热加重或出现新症状，提前就诊</li></>}
              {risk.level === 'green' && <><li>按计划随访，有新化验单随时拍进来</li><li>保持记录习惯，趋势比单次结果更重要</li></>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
