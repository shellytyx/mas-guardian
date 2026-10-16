interface Props {
  small?: boolean
}

const ROWS = [
  ['血常规 WBC', '6.2', '×10⁹/L', '4.0-10.0'],
  ['血红蛋白 HGB', '102', 'g/L', '110-150'],
  ['血小板 PLT', '98', '×10⁹/L', '100-300'],
  ['铁蛋白 SF', '3100', 'ng/mL', '30-300'],
  ['AST', '75', 'U/L', '15-40'],
  ['ALT', '64', 'U/L', '7-40'],
  ['乳酸脱氢酶 LDH', '520', 'U/L', '120-250'],
  ['血沉 ESR', '32', 'mm/h', '0-20'],
  ['纤维蛋白原 FIB', '2.2', 'g/L', '2.0-4.0'],
  ['甘油三酯 TG', '2.1', 'mmol/L', '0.3-1.7'],
]

export function MockReport({ small }: Props) {
  return (
    <svg
      viewBox="0 0 340 460"
      className={`mock-report ${small ? 'small' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="340" height="460" rx="6" fill="#fffdf8" />
      <text x="170" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">
        ××儿童医院 检验报告单
      </text>
      <text x="20" y="52" fontSize="10" fill="#64748b">姓名：乐乐  性别：男  年龄：6岁</text>
      <text x="20" y="68" fontSize="10" fill="#64748b">标本：静脉血  采样：2026-10-15 08:20</text>
      <line x1="20" y1="78" x2="320" y2="78" stroke="#cbd5e1" />
      <text x="20" y="94" fontSize="9" fill="#94a3b8">项目</text>
      <text x="180" y="94" fontSize="9" fill="#94a3b8">结果</text>
      <text x="250" y="94" fontSize="9" fill="#94a3b8">单位</text>
      <text x="295" y="94" fontSize="9" fill="#94a3b8">参考</text>
      <line x1="20" y1="100" x2="320" y2="100" stroke="#e2e8f0" />
      {ROWS.map((r, i) => (
        <g key={i}>
          <text x="20" y={120 + i * 32} fontSize="11" fill="#334155">{r[0]}</text>
          <text x="180" y={120 + i * 32} fontSize="13" fontWeight="700" fill="#0f172a">{r[1]}</text>
          <text x="250" y={120 + i * 32} fontSize="9" fill="#64748b">{r[2]}</text>
          <text x="288" y={120 + i * 32} fontSize="9" fill="#94a3b8">{r[3]}</text>
          <line x1="20" y1={128 + i * 32} x2="320" y2={128 + i * 32} stroke="#f1f5f9" />
        </g>
      ))}
      <text x="20" y="445" fontSize="9" fill="#94a3b8">审核：李××  报告时间：2026-10-15 10:05</text>
    </svg>
  )
}
