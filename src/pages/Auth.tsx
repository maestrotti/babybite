import { useState, type FormEvent } from 'react'
import { appUrl, errText, supabase } from '../lib/supabase'
import { ErrorBox, btnPrimary, card, input } from '../components/ui'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null); setInfo(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error
      } else if (mode === 'register') {
        if (password.length < 8) throw new Error('Lozinka mora imati najmanje 8 znakova.')
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: appUrl() } })
        if (error) throw error
        if (!data.session) setInfo('Račun je kreiran. Provjerite e-mail i potvrdite adresu, pa se prijavite.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() }); if (error) throw error
        setInfo('Ako račun postoji, poslali smo link za novu lozinku.')
      }
    } catch (err) { setError(errText(err)) } finally { setBusy(false) }
  }

  const title = { login: 'Prijava', register: 'Novi račun', recover: 'Zaboravljena lozinka' }[mode]
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-8">
      <div className="text-center"><div className="text-6xl" aria-hidden>🥣</div><h1 className="text-3xl font-extrabold">BabyBite</h1><p className="text-ink/70">Bilježite šta beba jede, na jednom mjestu.</p></div>
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h2 className="text-xl font-bold">{title}</h2>
        {mode === 'register' && <input className={input} placeholder="Vaše ime" aria-label="Ime" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />}
        <input className={input} type="email" required placeholder="E-mail" aria-label="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'recover' && <input className={input} type="password" required placeholder="Lozinka" aria-label="Lozinka" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />}
        {error && <ErrorBox text={error} />}
        {info && <div role="status" className="rounded-2xl bg-sage p-3">{info}</div>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'Molimo sačekajte…' : title}</button>
        <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-sagedeep">
          {mode !== 'login' && <button type="button" className="min-h-10 underline" onClick={() => { setMode('login'); setError(null); setInfo(null) }}>Imam račun</button>}
          {mode !== 'register' && <button type="button" className="min-h-10 underline" onClick={() => { setMode('register'); setError(null); setInfo(null) }}>Kreiraj račun</button>}
          {mode === 'login' && <button type="button" className="min-h-10 underline" onClick={() => { setMode('recover'); setError(null); setInfo(null) }}>Zaboravljena lozinka</button>}
        </div>
      </form>
    </main>
  )
}

export function SetNewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('Lozinka mora imati najmanje 8 znakova.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(errText(error)); else onDone()
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h1 className="text-xl font-bold">Nova lozinka</h1>
        <input className={input} type="password" required autoComplete="new-password" aria-label="Nova lozinka" placeholder="Nova lozinka (min. 8 znakova)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <ErrorBox text={error} />}
        <button className={`${btnPrimary} w-full`} disabled={busy}>Spremi lozinku</button>
      </form>
    </main>
  )
}
