interface Props {
  text: string
  tone: 'bad' | 'good' | 'flat'
}

export function TrendBadge({ text, tone }: Props) {
  return <span className={`badge badge-${tone}`}>{text}</span>
}
