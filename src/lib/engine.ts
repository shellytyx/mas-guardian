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

export interface StageWarning {
  stage: 1 | 2
  title: string
  detail: string
  suggestions: string[]
}

export function computeStageWarnings(
  visits: LabVisit[],
  checks: DailyCheck[],
  sjiaStatus?: string,
): StageWarning[] {
  const warnings: StageWarning[] = []
  const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.at(-1)
  const prev = sorted.at(-2)
  if (!latest) return warnings

  const v = latest.values
  const fever = lastFeverRunDays(checks) > 0
  const sjia = sjiaStatus === 'confirmed' || sjiaStatus === 'suspected'

  const abnormal: string[] = []
  const suggestions: string[] = []

  if (v.SF != null && v.SF > 300) abnormal.push(`铁蛋白 ${v.SF}`)
  if (v.PLT != null && v.PLT < 100) abnormal.push(`血小板 ${v.PLT}`)
  if (v.AST != null && v.AST > 40) abnormal.push(`AST ${v.AST}`)
  if (v.FIB != null && (v.FIB < 2.0 || v.FIB > 4.0)) abnormal.push(`纤维蛋白原 ${v.FIB}`)
  if (v.TG != null && v.TG > 1.7) abnormal.push(`甘油三酯 ${v.TG}`)
  if (v.LDH != null && v.LDH > 250) abnormal.push(`LDH ${v.LDH}`)
  if (v.ESR != null && v.ESR > 20) abnormal.push(`血沉 ${v.ESR}`)

  if (abnormal.length > 0) {
    const missing: string[] = []
    if (v.LDH == null) missing.push('LDH（乳酸脱氢酶）')
    if (v.ESR == null) missing.push('ESR（血沉）')
    if (v.FIB == null) missing.push('纤维蛋白原')
    if (v.TG == null) missing.push('甘油三酯')
    if (v.PLT == null) missing.push('血小板')
    if (v.AST == null) missing.push('AST')
    if (v.SF == null) missing.push('铁蛋白')
    if (missing.length) suggestions.push(`建议加测：${missing.join('、')}`)
    suggestions.push(`3-5 天后复查上述异常指标，继续观测变化趋势`)
    suggestions.push('每日记录体温，发热加重或出现出血点请提前联系医生')
    warnings.push({
      stage: 1,
      title: '指标异常倾向',
      detail: `${abnormal.join('、')} 超出参考范围`,
      suggestions,
    })
  }

  if (latest && prev) {
    const pv = prev.values
    const trendBad: string[] = []
    if (v.SF != null && pv.SF != null && pctChange(v.SF, pv.SF) >= 0.1) trendBad.push('铁蛋白↑')
    if (v.PLT != null && pv.PLT != null && pctChange(v.PLT, pv.PLT) <= -0.1) trendBad.push('血小板↓')
    if (v.AST != null && pv.AST != null && pctChange(v.AST, pv.AST) >= 0.1) trendBad.push('AST↑')
    if (v.FIB != null && pv.FIB != null && pctChange(v.FIB, pv.FIB) <= -0.1) trendBad.push('纤维蛋白原↓')

    if (trendBad.length >= 2 && fever && sjia) {
      warnings.push({
        stage: 2,
        title: 'MAS 风险预警',
        detail: `${trendBad.join('、')}，且持续发热 ${lastFeverRunDays(checks)} 天`,
        suggestions: [
          '尽快联系主治医生，说明指标变化趋势',
          '就诊时携带：近 30 天化验单 + 本应用截图',
          '如孩子出现持续高热、出血点、嗜睡，不要等待',
        ],
      })
    }
  }

  return warnings
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

export interface Advice {
  tips: string[]
  actions: string[]
  department: string
  urgency: string
}

export function adviceFor(level: RiskLevel): Advice {
  if (level === 'red') {
    return {
      urgency: '立即处理',
      department: '急诊 / 风湿免疫科',
      tips: [
        '立即联系主治医生或前往急诊，说明 MAS 风险',
        '就诊时携带：近 30 天化验单 + 本应用截图',
        '如孩子出现持续高热、出血点、嗜睡，不要等待',
      ],
      actions: [
        '今天就联系主治医生，说明指标变化',
        '如孩子出现持续高热、出血点、嗜睡，直接急诊',
        '就诊带上：近 30 天化验单 + 本页截图',
      ],
    }
  }
  if (level === 'orange') {
    return {
      urgency: '今天内',
      department: '风湿免疫科门诊',
      tips: [
        '今天内联系主治医生，说明指标变化趋势',
        '每 4-6 小时测量并记录体温',
        '观察有无新出血点、瘀斑、精神变差',
      ],
      actions: [
        '今天内联系主治医生说明变化趋势',
        '记录每天体温，观察有无出血点',
        '就诊带上：近 30 天化验单 + 本页截图',
      ],
    }
  }
  if (level === 'yellow') {
    return {
      urgency: '近几天',
      department: '风湿免疫科门诊',
      tips: [
        '近几天安排复查，对比指标趋势',
        '继续按计划记录体温和化验单',
        '如发热加重或出现新症状，提前就诊',
      ],
      actions: [
        '近几天安排复查，对比指标趋势',
        '继续按计划记录化验单',
      ],
    }
  }
  return {
    urgency: '按计划',
    department: '按医嘱随访',
    tips: ['按计划随访，有新化验单随时拍进来', '保持记录习惯，趋势比单次结果更重要'],
    actions: ['按计划随访，有新化验单随时拍进来'],
  }
}

export function riskBarPosition(level: RiskLevel, prox: number): number {
  // 等级和滑块位置必须一致：等级决定区间，proximityScore 决定区间内位置
  switch (level) {
    case 'red':
      return Math.max(85, Math.min(98, prox))
    case 'orange':
      return Math.max(66, Math.min(84, prox))
    case 'yellow':
      return Math.max(33, Math.min(65, prox))
    case 'green':
    default:
      return Math.max(2, Math.min(32, prox))
  }
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
