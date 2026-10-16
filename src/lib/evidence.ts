export interface Evidence {
  ruleId: string
  title: string
  quote: string
  source: string
}

const EVIDENCE: Record<string, Evidence> = {
  'criteria-2016': {
    ruleId: 'criteria-2016',
    title: '2016 PRINTO/ACR/EULAR MAS 分类标准',
    quote:
      '确诊或疑似 sJIA 的患者出现发热，且铁蛋白 > 684 ng/mL，并具有以下任意 2 条以上：血小板 < 181×10⁹/L、AST > 48 U/L、甘油三酯 > 156 mg/dL、纤维蛋白原 < 3.6 g/L。',
    source: 'Gerard et al. 2016；需求书 §2.1',
  },
  'ms-score': {
    ruleId: 'ms-score',
    title: 'MAS/sJIA (MS) 评分',
    quote:
      'MS 评分由 7 个变量构成（中枢神经系统受累 +2.44、出血 +1.54、关节炎 −1.30、血小板 −0.003、LDH +0.001、纤维蛋白原 −0.004、铁蛋白 +0.0001），临界值 ≥ −2.1 时 sJIA 合并 MAS 可能性大，敏感性 0.85、特异性 0.95。',
    source: 'Minoia et al. Ann Rheum Dis 2019;78:1357',
  },
  'delta-plt': {
    ruleId: 'delta-plt',
    title: '血小板动态下降',
    quote:
      '在早期/亚临床 MAS 中，指标相对变化（血小板、纤维蛋白原下降，铁蛋白上升）比达到绝对阈值更有提示意义；专家共识将血小板、铁蛋白、AST 列为变化最有价值的三项检验。',
    source: '2023 EULAR/PReS 推荐；RMD Open 2022 动态指标专家共识',
  },
  'delta-sf': {
    ruleId: 'delta-sf',
    title: '铁蛋白动态上升',
    quote:
      '血清铁蛋白升高或上升是应考虑早期或亚临床 MAS 的实验室特征之一；就诊间显著上升比单点阈值更早预警。',
    source: '2023 EULAR/PReS 推荐（需求书 §1.3、§4.5）',
  },
  'delta-fib': {
    ruleId: 'delta-fib',
    title: '纤维蛋白原动态下降',
    quote:
      '纤维蛋白原进行性下降是 MAS 消耗性凝血障碍的特征；相对下降即可提示 MAS，而非必须跌破绝对下限。',
    source: 'RMD Open 2022 动态指标专家共识',
  },
  'ratio-fer-esr': {
    ruleId: 'ratio-fer-esr',
    title: '铁蛋白/血沉比值 ≥ 21.5',
    quote:
      '铁蛋白:ESR 比值 21.5 对诊断 sJIA-MAS 的敏感性 82%、特异性 78%，与 ACR-EULAR 标准相当，且计算简便。',
    source: 'Eloseily et al. ACR Open Rheumatol 2019',
  },
  'ratio-fer-plt': {
    ruleId: 'ratio-fer-plt',
    title: '铁蛋白/血小板比值 ≥ 1.1',
    quote:
      'sJIA 诊断时铁蛋白/血小板比值 ≥ 1.1 预测 MAS 倾向病程，敏感性 90%、特异性 82.6%。',
    source: 'Batu et al. Clin Rheumatol 2023',
  },
  'fever': {
    ruleId: 'fever',
    title: '持续发热',
    quote:
      '快速进展的持续发热是 MAS 典型临床特征；发热是所有 MAS 判定标准的强制前提。',
    source: '需求书 §1.2、§2.1',
  },
}

export function evidenceOf(ruleId: string): Evidence | undefined {
  return EVIDENCE[ruleId]
}
