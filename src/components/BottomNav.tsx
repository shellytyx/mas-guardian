import { useStore } from '../lib/store'
import { IcoHome, IcoChart, IcoPlus, IcoCheck } from './Ico'

export function BottomNav() {
  const { page, navigate } = useStore()
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${page.name === 'home' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'home' })}
      >
        <span className="nav-icon"><IcoHome size={23} /></span>
        <span>预警</span>
      </button>
      <button
        className={`nav-item ${page.name === 'support' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'support' })}
      >
        <span className="nav-icon"><IcoCheck size={23} /></span>
        <span>支持</span>
      </button>
      <button
        className={`nav-item nav-center ${page.name === 'capture' || page.name === 'entry' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'capture' })}
      >
        <span className="nav-plus"><IcoPlus size={30} /></span>
        <span>录入</span>
      </button>
      <button
        className={`nav-item ${page.name === 'manage' || page.name === 'detail' ? 'active' : ''}`}
        onClick={() => navigate({ name: 'manage' })}
      >
        <span className="nav-icon"><IcoChart size={23} /></span>
        <span>管理</span>
      </button>
    </nav>
  )
}
