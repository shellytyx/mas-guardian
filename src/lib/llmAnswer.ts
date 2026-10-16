import type { LabVisit, RiskResult } from '../types'

interface Context {
  question: string
  risk: unknown
  latestVisit?: LabVisit
  subjective?: string
}

function fmtLevel(level: string): string {
  const map: Record<string, string> = { green: '平稳', yellow: '关注', orange: '恶化', red: '高危' }
  return map[level] ?? level
}

export function generateLocalAnswer(ctx: Context): string {
  const q = ctx.question.toLowerCase()
  const r = ctx.risk as RiskResult | null
  const v = ctx.latestVisit?.values
  const sub = ctx.subjective

  const level = r ? fmtLevel(r.level) : '未知'
  const msScore = r?.msScore != null ? `MS 评分 ${r.msScore}` : 'MS 评分未计算'

  if (/医院|急诊|要不要去|需要就诊|去医院|就医/.test(q)) {
    if (!r || r.level === 'green') {
      return `目前预警等级是「${level}」，指标相对平稳，可以按计划随访，不必紧张。但如果出现持续高热、出血点或精神萎靡，建议提前联系医生。`
    }
    if (r.level === 'yellow') {
      return `预警等级是「${level}」，有指标出现早期变化，建议近几天安排复查，同时记录体温。如果孩子发热加重或出现新症状，请提前就诊。`
    }
    if (r.level === 'orange') {
      return `预警等级是「${level}」，多项指标在恶化，建议今天内联系主治医生。就诊时带上近 30 天化验单和本页截图。`
    }
    return `预警等级是「${level}」，多项指标达到高危范围，请立即联系主治医生或前往急诊。带上近 30 天化验单和本页截图，说明 MAS 风险。`
  }

  if (/铁蛋白|ferritin|sf/.test(q)) {
    const sf = v?.SF
    if (sf == null) return '最近这次化验单里没有铁蛋白数值，建议补录或拍照上传。'
    let text = `最近一次铁蛋白是 ${sf} ng/mL。`
    if (sf > 684) text += '这个数值已经超过 2016 MAS 分类标准的 684 阈值，是重要预警信号，请尽快联系医生。'
    else if (sf > 300) text += '这个数值高于常见参考范围（约 300），需要结合血小板、AST 等指标一起观察趋势。'
    else text += '数值目前不高，但仍需观察变化趋势。'
    text += ` 目前预警等级为「${level}」。`
    return text
  }

  if (/血小板|plt/.test(q)) {
    const plt = v?.PLT
    if (plt == null) return '最近这次化验单里没有血小板数值，建议补录或拍照上传。'
    let text = `最近一次血小板是 ${plt} ×10⁹/L。`
    if (plt < 181) text += '低于 MAS 分类标准的 181 阈值，需要警惕。'
    else if (plt < 100) text += '已低于 100，属于明显降低，建议尽快联系医生。'
    else text += '目前数值尚可，但趋势更重要。'
    text += ` 预警等级为「${level}」。`
    return text
  }

  if (/发烧|发热|温度|体温/.test(q)) {
    const temp = ctx.latestVisit ? undefined : undefined
    return '请直接在首页点击「记体温」记录。体温是 MAS 预警的重要客观指标，建议每日测量。' + (sub ? ` 你之前记录过："${sub}"` : '')
  }

  if (/ms|评分|风险等级|严重吗/.test(q)) {
    return `当前预警等级为「${level}」，${msScore}。${r?.headline ?? ''} 建议结合具体指标变化趋势判断，如有疑问可点击「查看依据」了解医学解释。`
  }

  if (/sJIA|是什么|幼年特发性关节炎/.test(q)) {
    return 'sJIA（系统性幼年特发性关节炎）是一种儿童风湿性疾病，常见表现有反复高热、皮疹、关节痛。MAS（巨噬细胞活化综合征）是 sJIA 的严重并发症，需密切监测铁蛋白、血小板、AST 等指标变化。'
  }

  if (/MAS|巨噬细胞/.test(q)) {
    return 'MAS 是 sJIA 可能合并的严重炎症反应综合征。早期信号包括：持续发热、铁蛋白快速上升、血小板下降、AST 升高、纤维蛋白原下降等。本应用会基于你的化验单动态评估风险。'
  }

  return `我结合你当前的预警等级「${level}」和最近一次化验单来看：${r?.headline ?? '暂无预警信息'}。如果想了解具体指标，可以问“铁蛋白多少”“血小板正常吗”等。`
}
