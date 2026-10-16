interface IcoProps {
  size?: number
  className?: string
}

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  className,
  'aria-hidden': true as const,
})

export function IcoCamera({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="2.5" y="6.5" width="19" height="13.5" rx="3.5" fill="#6C9CF5" />
      <path d="M8.5 6.5l1.3-2.2a1.6 1.6 0 0 1 1.4-.8h1.6a1.6 1.6 0 0 1 1.4.8l1.3 2.2" fill="#6C9CF5" />
      <circle cx="12" cy="13.2" r="4.4" fill="#fff" />
      <circle cx="12" cy="13.2" r="2.6" fill="#A8C7FA" />
      <circle cx="17.8" cy="9.6" r="1.1" fill="#FF8A8A" />
    </svg>
  )
}

export function IcoPencil({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 20l1.2-4.2L15.6 5.4a2.1 2.1 0 0 1 3 3L8.2 18.8 4 20z" fill="#FF8A8A" />
      <path d="M14.4 6.6l3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 20l1.2-4.2 3 3L4 20z" fill="#fff" />
      <path d="M5.4 15.6l3 3" stroke="#6C9CF5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function IcoThermo({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="10" y="2.5" width="4" height="13" rx="2" fill="#fff" stroke="#6C9CF5" strokeWidth="1.6" />
      <circle cx="12" cy="18" r="4" fill="#FF8A8A" />
      <rect x="11.1" y="9" width="1.8" height="7" rx="0.9" fill="#FF8A8A" />
      <circle cx="12" cy="18.4" r="1.6" fill="#FF6B6B" />
      <path d="M15.5 6h2M15.5 9h1.4" stroke="#A8C7FA" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function IcoClock({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 5.5L7 3.4M19.5 5.5L17 3.4" stroke="#FF8A8A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="13" r="8" fill="#6C9CF5" />
      <circle cx="12" cy="13" r="6" fill="#fff" />
      <path d="M12 9.6V13l2.4 1.6" stroke="#4A7CF0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function IcoAlert({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3.6c.7 0 1.3.4 1.7 1l7.4 12.8c.8 1.4-.2 3.2-1.8 3.2H4.7c-1.6 0-2.6-1.8-1.8-3.2L10.3 4.6c.4-.6 1-1 1.7-1z" fill="#FF8A8A" />
      <rect x="11" y="9" width="2" height="5.4" rx="1" fill="#fff" />
      <circle cx="12" cy="17" r="1.2" fill="#fff" />
    </svg>
  )
}

export function IcoCheck({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" fill="#6C9CF5" />
      <path d="M7.8 12.4l2.8 2.8 5.6-5.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function IcoClose({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" fill="#E2E8F0" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IcoHome({ size = 24, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 11.2L12 4.6l7.5 6.6" stroke="#6C9CF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M6.4 10.4v8a1.6 1.6 0 0 0 1.6 1.6h8a1.6 1.6 0 0 0 1.6-1.6v-8" fill="#E3EEFF" stroke="#6C9CF5" strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="10.4" y="14" width="3.2" height="6" rx="1.2" fill="#FF8A8A" />
    </svg>
  )
}

export function IcoChart({ size = 24, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="12" width="3.6" height="8" rx="1.8" fill="#A8C7FA" />
      <rect x="10.2" y="7" width="3.6" height="13" rx="1.8" fill="#6C9CF5" />
      <rect x="16.4" y="10" width="3.6" height="10" rx="1.8" fill="#FF8A8A" />
    </svg>
  )
}

export function IcoPlus({ size = 26, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9.5" fill="#6C9CF5" />
      <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function IcoChevron({ size = 16, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9.5 6.5L15 12l-5.5 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function IcoBack({ size = 16, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14.5 6.5L9 12l5.5 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function IcoInfo({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" fill="#A8C7FA" />
      <circle cx="12" cy="8.2" r="1.3" fill="#fff" />
      <rect x="10.9" y="10.8" width="2.2" height="5.6" rx="1.1" fill="#fff" />
    </svg>
  )
}

export function IcoPhoto({ size = 20, className }: IcoProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="#E3EEFF" stroke="#6C9CF5" strokeWidth="1.8" />
      <circle cx="8.6" cy="10" r="1.8" fill="#FF8A8A" />
      <path d="M4 17l4.6-4.4a2 2 0 0 1 2.7 0L16 17" stroke="#6C9CF5" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function HeartHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="52" fill="#f6f8fa" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#d0d7de" strokeWidth="2" />
      <path d="M60 26c-18 0-34 14-34 34 0 24 34 52 34 52s34-28 34-52c0-20-16-34-34-34z" fill="#fff" stroke="#1a7f37" strokeWidth="3" />
      <path d="M60 43v14M52 50h16" stroke="#1a7f37" strokeWidth="4" strokeLinecap="round" />
      <circle cx="94" cy="34" r="4" fill="#0969da" />
      <circle cx="26" cy="86" r="3" fill="#0969da" />
    </svg>
  )
}
