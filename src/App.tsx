import { StoreProvider, useStore } from './lib/store'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { Support } from './pages/Support'
import { Manage } from './pages/Manage'
import { Capture } from './pages/Capture'
import { Entry } from './pages/Entry'
import { Detail } from './pages/Detail'
import { Alert } from './pages/Alert'
import { Onboarding } from './pages/Onboarding'

function Router() {
  const { page } = useStore()
  return (
    <div className="app-shell">
      <main className="app-main">
        {page.name === 'onboarding' && <Onboarding />}
        {page.name === 'capture' && <Capture />}
        {page.name === 'entry' && <Entry />}
        {page.name === 'detail' && <Detail />}
        {page.name === 'alert' && <Alert />}
        {page.name === 'home' && <Home />}
        {page.name === 'support' && <Support />}
        {page.name === 'manage' && <Manage />}
      </main>
      {page.name !== 'onboarding' && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  )
}
