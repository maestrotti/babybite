import { useEffect, useState } from 'react'
import { supabase, errText } from '../lib/supabase'
import { ErrorBox, btnDanger, btnPrimary, btnSoft, card, input } from '../components/ui'

export default function Settings({ email, userId }: { email: string; userId: string }) {
  const [name, setName] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { void supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle().then(({ data }) => setName(data?.display_name ?? '')) }, [userId])

  async function saveName() {
    setError(null); setMsg(null)
    const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', userId)
    if (error) setError(errText(error)); else setMsg('Ime je spremljeno.')
  }
  async function remove() {
    setBusy(true); setError(null)
    const { error } = await supabase.rpc('delete_my_account')
    if (error) { setBusy(false); return setError(errText(error)) }
    await supabase.auth.signOut()
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Postavke</h1>
      <section className={`${card} space-y-3`}>
        <p className="text-ink/70">Prijavljeni ste kao <b>{email}</b></p>
        <input className={input} aria-label="Ime" placeholder="Vaše ime" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-2"><button className={btnPrimary} onClick={() => void saveName()}>Spremi ime</button><button className={btnSoft} onClick={() => void supabase.auth.signOut()}>Odjava</button></div>
        {msg && <div role="status" className="rounded-2xl bg-sage p-3">{msg}</div>}
        {error && <ErrorBox text={error} />}
      </section>
      <section className={`${card} space-y-2 text-sm`}>
        <h2 className="text-base font-bold">Privatnost</h2>
        <p>Vaši obroci se čuvaju u Supabase bazi podataka (u oblaku), vezani za vaš račun, i vidljivi su samo vama (zaštita na nivou baze, RLS). Brisanje historije preglednika ili keša ne briše obroke. Aplikacija ne čuva medicinske podatke i ne dijeli podatke s trećim stranama.</p>
        <p>Podatke možete obrisati pojedinačno u Historiji ili cijeli račun ispod.</p>
      </section>
      <section className={`${card} space-y-3`}>
        <h2 className="font-bold text-red-800">Brisanje računa</h2>
        <p className="text-sm">Trajno briše račun, profil i sve obroke. Ovo se ne može poništiti. Upišite <b>OBRIŠI</b> za potvrdu.</p>
        <input className={input} aria-label="Potvrda brisanja" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className={btnDanger} disabled={confirm !== 'OBRIŠI' || busy} onClick={() => void remove()}>Obriši račun</button>
      </section>
    </div>
  )
}
