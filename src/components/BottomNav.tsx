import { useStore } from '../lib/store'

export function BottomNav() {
  const { page, navigate } = useStore()
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${page.name === 'home' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'home' })}
      >
        <span className="nav-icon">⌂</span>
        <span>首页</span>
      </button>
      <button
        className={`nav-item nav-center ${page.name === 'capture' || page.name === 'entry' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'capture' })}
      >
        <span className="nav-plus">＋</span>
        <span>录入</span>
      </button>
      <button
        className={`nav-item ${page.name === 'detail' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'detail' })}
      >
        <span className="nav-icon">▤</span>
        <span>数据</span>
      </button>
    </nav>
  )
}
