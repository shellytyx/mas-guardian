import type { RiskLevel } from '../types'
import { LEVEL_META } from '../lib/engine'
import { IcoChevron } from './Ico'

const POS: Record<string, number> = { green: 8, yellow: 36, orange: 64, red: 90, gray: 8 }

interface Props {
  level: RiskLevel
  headline: string
  onClick?: () => void
}

export function RiskBar({ level, headline, onClick }: Props) {
  const meta = level === 'gray' ? null : LEVEL_META[level]
  return (
    <button className={`riskbar ${level}`} onClick={onClick}>
      <div className="riskbar-track">
        <div className="riskbar-cursor" style={{ left: `${POS[level] ?? 8}%` }}>
          <span className="riskbar-dot" />
        </div>
      </div>
      <div className="riskbar-row">
        <span className="riskbar-level" style={{ color: meta?.color ?? '#94a3b8', background: meta?.bg ?? '#e2e8f0' }}>
          {meta?.label ?? '数据不足'}
        </span>
        <span className="riskbar-headline">{headline}</span>
        {onClick && <span className="riskbar-more">详情 <IcoChevron size={13} /></span>}
      </div>
    </button>
  )
}
