import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { BarChart3, Clock, Home, PlusCircle, Settings, Apple } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { configured, supabase } from './lib/supabase'
import { StoreProvider } from './lib/store'
import { Spinner, useOnline } from './components/ui'
import Auth, { SetNewPassword } from './pages/Auth'
import HomePage from './pages/Home'
import MealForm from './pages/MealForm'
import Foods from './pages/Foods'
import History from './pages/History'
import Stats from './pages/Stats'
import SettingsPage from './pages/Settings'

const NAV = [
  { to: '/', label: 'Početna', Icon: Home }, { to: '/dodaj', label: 'Dodaj obrok', Icon: PlusCircle },
  { to: '/namirnice', label: 'Namirnice', Icon: Apple }, { to: '/historija', label: 'Historija', Icon: Clock },
  { to: '/statistika', label: 'Statistika', Icon: BarChart3 }, { to: '/postavke', label: 'Postavke', Icon: Settings },
]

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const online = useOnline()

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configured) return <div className="p-6"><h1 className="text-xl font-bold">Nedostaje konfiguracija</h1><p className="mt-2">Postavite VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY (vidi README.md).</p></div>
  if (!ready) return <Spinner />
  if (recovery && session) return <SetNewPassword onDone={() => setRecovery(false)} />
  if (!session) return <Auth />

  return (
    <StoreProvider>
      {!online && <div role="status" className="bg-butter px-4 py-2 text-center text-sm font-semibold">Nema interneta. Možete pregledati učitane podatke, ali spremanje nije moguće dok se veza ne vrati.</div>}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dodaj" element={<MealForm />} />
          <Route path="/obrok/:id" element={<MealForm />} />
          <Route path="/namirnice" element={<Foods />} />
          <Route path="/historija" element={<History />} />
          <Route path="/statistika" element={<Stats />} />
          <Route path="/postavke" element={<SettingsPage email={session.user.email ?? ''} userId={session.user.id} />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <nav aria-label="Glavna navigacija" className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-2xl grid-cols-6">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-sagedeep' : 'text-ink/60'}`}>
                <Icon size={22} aria-hidden />{label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </StoreProvider>
  )
}
