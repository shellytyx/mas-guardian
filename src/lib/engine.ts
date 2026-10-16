import type { IndicatorKey, LabVisit, DailyCheck, Reason, RiskResult, RiskLevel } from '../types'

function val(v: LabVisit | undefined, k: IndicatorKey): number | undefined {
  return v?.values[k]
}

function pctChange(cur: number, prev: number): number {
  return (cur - prev) / prev
}

export function lastFeverRunDays(checks: DailyCheck[]): number {
  const feverDates = checks.filter((c) => (c.temp ?? 0) >= 37.5).map((c) => c.date).sort()
  if (!feverDates.length) return 0
  const set = new Set(feverDates)
  let run = 1
  let cursor = new Date(feverDates[feverDates.length - 1] + 'T00:00:00')
  while (true) {
    const prevDay = new Date(cursor.getTime() - 86400000)
    const key = prevDay.toISOString().slice(0, 10)
    if (set.has(key)) {
      run += 1
      cursor = prevDay
    } else break
  }
  return run
}

export function computeRisk(visits: LabVisit[], checks: DailyCheck[], sjiaStatus?: string): RiskResult {
  const reasons: Reason[] = []
  const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.at(-1)
  const prev = sorted.at(-2)
  const feverDays = lastFeverRunDays(checks)
  const hasFever = feverDays > 0
  const hasSjia = sjiaStatus === 'confirmed' || sjiaStatus === 'suspected'

  const sf = val(latest, 'SF')
  const plt = val(latest, 'PLT')
  const ast = val(latest, 'AST')
  const fib = val(latest, 'FIB')
  const tg = val(latest, 'TG')
  const ldh = val(latest, 'LDH')
  const esr = val(latest, 'ESR')

  let msScore: number | null = null
  if (plt != null && ldh != null && fib != null && sf != null) {
    msScore =
      plt * -0.003 +
      ldh * 0.001 +
      fib * 100 * -0.004 +
      sf * 0.0001
    msScore = Math.round(msScore * 100) / 100
  }
  const msPositive = msScore != null && msScore >= -2.1

  const hits2016: string[] = []
  if (plt != null && plt < 181) hits2016.push(`血小板 ${plt} < 181`)
  if (ast != null && ast > 48) hits2016.push(`AST ${ast} > 48`)
  if (tg != null && tg * 88.57 > 156) hits2016.push(`甘油三酯 ${tg} > 156 mg/dL`)
  if (fib != null && fib < 3.6) hits2016.push(`纤维蛋白原 ${fib} < 3.6`)
  const ferritinOk = sf != null && sf > 684
  const criteria2016 = { ferritinOk, hits: hits2016, met: ferritinOk && hits2016.length >= 2 && hasFever && hasSjia }

  const ferEsr = sf != null && esr != null && esr > 0 ? Math.round((sf / esr) * 10) / 10 : null
  const ferPlt = sf != null && plt != null && plt > 0 ? Math.round((sf / plt) * 10) / 10 : null

  if (criteria2016.met) {
    reasons.push({
      ruleId: 'criteria-2016',
      severity: 'red',
      text: `已满足 2016 MAS 分类标准：铁蛋白 ${sf} > 684，且 ${hits2016.length} 项达标（${hits2016.join('、')}）`,
    })
  }
  if (msPositive) {
    reasons.push({
      ruleId: 'ms-score',
      severity: 'red',
      text: `MS 评分 ${msScore} ≥ 临界值 −2.1，sJIA 合并 MAS 可能性大`,
    })
  }

  if (latest && prev) {
    const pSF = val(prev, 'SF'), pPLT = val(prev, 'PLT'), pAST = val(prev, 'AST'), pFIB = val(prev, 'FIB')
    if (sf != null && pSF != null && pctChange(sf, pSF) >= 0.3) {
      reasons.push({
        ruleId: 'delta-sf',
        severity: pctChange(sf, pSF) >= 0.5 ? 'red' : 'orange',
        text: `铁蛋白较上次（${prev.date}）上升 ${Math.round(pctChange(sf, pSF) * 100)}%（${pSF} → ${sf}）`,
      })
    }
    if (plt != null && pPLT != null && pctChange(plt, pPLT) <= -0.2) {
      reasons.push({
        ruleId: 'delta-plt',
        severity: pctChange(plt, pPLT) <= -0.4 ? 'red' : 'orange',
        text: `血小板较上次（${prev.date}）下降 ${Math.round(-pctChange(plt, pPLT) * 100)}%（${pPLT} → ${plt}）`,
      })
    }
    if (ast != null && pAST != null && pctChange(ast, pAST) >= 0.3) {
      reasons.push({
        ruleId: 'delta-plt',
        severity: 'orange',
        text: `AST 较上次上升 ${Math.round(pctChange(ast, pAST) * 100)}%（${pAST} → ${ast}）`,
      })
    }
    if (fib != null && pFIB != null && pctChange(fib, pFIB) <= -0.2) {
      reasons.push({
        ruleId: 'delta-fib',
        severity: 'orange',
        text: `纤维蛋白原较上次下降 ${Math.round(-pctChange(fib, pFIB) * 100)}%（${pFIB} → ${fib}）`,
      })
    }
  }

  if (ferEsr != null && ferEsr >= 21.5) {
    reasons.push({
      ruleId: 'ratio-fer-esr',
      severity: 'orange',
      text: `铁蛋白/血沉比值 ${ferEsr} ≥ 21.5（诊断 sJIA-MAS 敏感性 82%）`,
    })
  }
  if (ferPlt != null && ferPlt >= 1.1) {
    reasons.push({
      ruleId: 'ratio-fer-plt',
      severity: 'orange',
      text: `铁蛋白/血小板比值 ${ferPlt} ≥ 1.1（预测 MAS 倾向病程）`,
    })
  }
  if (hasFever) {
    reasons.push({
      ruleId: 'fever',
      severity: feverDays >= 3 ? 'orange' : 'yellow',
      text: `已连续发热 ${feverDays} 天${feverDays >= 3 ? '（最近体温见时间线）' : ''}`,
    })
  }

  const severityRank = { red: 3, orange: 2, yellow: 1 } as const
  const worst = reasons.reduce<RiskLevel>((acc, r) => {
    const cur = severityRank[r.severity]
    const curAcc = acc === 'red' ? 3 : acc === 'orange' ? 2 : acc === 'yellow' ? 1 : 0
    if (cur > curAcc) return r.severity as RiskLevel
    return acc
  }, 'green')

  let level: RiskLevel = worst
  if (criteria2016.met || msPositive) level = 'red'
  else if (level === 'orange' && hasFever && reasons.filter((r) => r.severity === 'orange').length >= 2) level = 'red'
  else if (level === 'yellow' && !criteria2016.met && !msPositive && reasons.length === 1) level = 'yellow'

  const headline = headlineFor(level, reasons)

  return {
    level,
    headline,
    reasons,
    msScore,
    msPositive,
    criteria2016,
    ratios: { ferEsr, ferPlt },
    updatedAt: latest?.date ?? '—',
  }
}

function headlineFor(level: RiskLevel, reasons: Reason[]): string {
  switch (level) {
    case 'red':
      return '多项指标达到高危范围，请今天联系医生就医'
    case 'orange':
      return `${reasons.length} 项指标在恶化，建议今天联系医生`
    case 'yellow':
      return '有指标出现早期变化，建议近期复查并观察'
    case 'green':
      return '目前指标平稳，按计划随访即可'
    default:
      return '记录第一次化验后，这里会出现风险评估'
  }
}

export const LEVEL_META: Record<Exclude<RiskLevel, 'gray'>, { label: string; color: string; bg: string }> = {
  green:  { label: '平稳', color: '#16a34a', bg: '#dcfce7' },
  yellow: { label: '关注', color: '#ca8a04', bg: '#fef9c3' },
  orange: { label: '恶化', color: '#ea580c', bg: '#ffedd5' },
  red:    { label: '高危', color: '#dc2626', bg: '#fee2e2' },
}

export function trendBadge(latest: number | undefined, prev: number | undefined, badDirection: 'up' | 'down'):
  | { text: string; tone: 'bad' | 'good' | 'flat' } {
  if (latest == null || prev == null || prev === 0) return { text: '—', tone: 'flat' }
  const change = (latest - prev) / prev
  if (Math.abs(change) < 0.05) return { text: '→ 平稳', tone: 'flat' }
  const worse = badDirection === 'up' ? change > 0 : change < 0
  const arrow = change > 0 ? '↗' : '↘'
  const pct = Math.abs(Math.round(change * 100))
  return {
    text: `${arrow} ${pct}%`,
    tone: worse ? 'bad' : 'good',
  }
}

export function proximityScore(
  latest: LabVisit | undefined,
  checks: DailyCheck[],
  sjiaStatus?: string,
): number {
  if (!latest) return 0
  const v = latest.values
  const fever = lastFeverRunDays(checks) > 0
  const sjia = sjiaStatus === 'confirmed' || sjiaStatus === 'suspected'
  const prox = (val: number | undefined, threshold: number, badUp: boolean) => {
    if (val == null) return 0
    return badUp ? Math.min(1, val / threshold) : Math.min(1, threshold / Math.max(val, 0.001))
  }
  return Math.round(
    Math.min(
      100,
      prox(v.SF, 684, true) * 28 +
        prox(v.PLT, 181, false) * 18 +
        prox(v.AST, 48, true) * 18 +
        prox(v.TG, 1.76, true) * 18 +
        prox(v.FIB, 3.6, false) * 18 +
        (fever ? 8 : 0) +
        (sjia ? 8 : 0),
    ),
  )
}
