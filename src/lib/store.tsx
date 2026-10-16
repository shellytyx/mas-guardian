import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { DailyCheck, LabVisit, Page, Patient, RiskResult } from '../types'
import { api } from './api'
import { computeRisk } from './engine'

const PROFILE_KEY = 'mas-guardian-profile'

interface Store {
  patient: Patient | null
  visits: LabVisit[]
  checks: DailyCheck[]
  risk: RiskResult | null
  page: Page
  navigate(p: Page): void
  refresh(): Promise<void>
  addVisit(v: Omit<LabVisit, 'id'>): Promise<void>
  addCheck(c: DailyCheck): Promise<void>
  updateProfile(p: Patient): Promise<void>
  resetDemo(): void
}

const Ctx = createContext<Store | null>(null)

function loadProfile(): Patient | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<LabVisit[]>([])
  const [checks, setChecks] = useState<DailyCheck[]>([])
  const [page, setPage] = useState<Page>({ name: 'home' })

  const refresh = useCallback(async () => {
    const profile = loadProfile()
    const [v, c] = await Promise.all([api.getVisits(), api.getChecks()])
    setPatient(profile)
    setVisits(v)
    setChecks(c)
  }, [])

  useEffect(() => {
    const profile = loadProfile()
    if (profile) {
      setPatient(profile)
      setPage({ name: 'home' })
    } else {
      setPage({ name: 'onboarding' })
    }
    refresh()
  }, [refresh])

  const risk = useMemo(
    () => (visits.length ? computeRisk(visits, checks, patient?.sjiaStatus) : null),
    [visits, checks, patient],
  )

  const addVisit = useCallback(
    async (v: Omit<LabVisit, 'id'>) => {
      await api.saveVisit(v)
      await refresh()
    },
    [refresh],
  )

  const addCheck = useCallback(
    async (c: DailyCheck) => {
      await api.saveCheck(c)
      await refresh()
    },
    [refresh],
  )

  const updateProfile = useCallback(async (p: Patient) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    setPatient(p)
  }, [])
  const resetDemo = useCallback(() => {
    localStorage.removeItem('mas-guardian-v1')
    localStorage.removeItem('mas-guardian-profile')
    location.reload()
  }, [])

  const value: Store = {
    patient,
    visits,
    checks,
    risk,
    page,
    navigate: setPage,
    refresh,
    addVisit,
    addCheck,
    updateProfile,
    resetDemo,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
