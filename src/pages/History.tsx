import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase, errText } from '../lib/supabase'
import { useStore } from '../lib/store'
import { dayKey, dayLabel, timeLabel } from '../lib/meal'
import { CATEGORIES, MEAL_TYPES, MEAL_TYPE_LABEL, PREF_LABEL } from '../types'
import { Empty, ErrorBox, FoodImage, Spinner, btnDanger, btnSoft, card, input } from '../components/ui'

export default function History() {
  const { meals, foodMap, loading, error, reload } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    const out = new Map<string, typeof meals>()
    for (const m of meals) {
      const fs = m.meal_items.map((i) => foodMap.get(i.food_id)).filter((f) => !!f)
      const k = dayKey(new Date(m.eaten_at))
      if (s && !fs.some((f) => f.name.toLowerCase().includes(s))) continue
      if (cat && !fs.some((f) => f.category === cat)) continue
      if (type && m.meal_type !== type) continue
      if (from && k < from) continue
      if (to && k > to) continue
      out.set(k, [...(out.get(k) ?? []), m])
    }
    return [...out.entries()]
  }, [meals, foodMap, q, cat, type, from, to])

  async function del(id: string) {
    const { error } = await supabase.from('meals').delete().eq('id', id)
    setConfirm(null)
    if (error) setMsg(errText(error)); else { setMsg(null); await reload() }
  }
  if (loading) return <Spinner />
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Historija</h1>
      <div className={`${card} grid grid-cols-2 gap-2`}>
        <input className={`${input} col-span-2`} placeholder="Traži po namirnici" aria-label="Traži po namirnici" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={input} aria-label="Kategorija" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Sve kategorije</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select className={input} aria-label="Vrsta obroka" value={type} onChange={(e) => setType(e.target.value)}><option value="">Svi obroci</option>{MEAL_TYPES.map((t) => <option key={t} value={t}>{MEAL_TYPE_LABEL[t]}</option>)}</select>
        <label className="text-sm">Od<input type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-sm">Do<input type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      {error && <ErrorBox text={error} onRetry={() => void reload()} />}
      {msg && <ErrorBox text={msg} />}
      {groups.length === 0 ? <Empty emoji="📖" title={meals.length ? 'Nema obroka za ove filtere' : 'Historija je prazna'} text={meals.length ? 'Promijenite ili obrišite filtere.' : 'Kad dodate obrok, pojavit će se ovdje.'} /> :
        groups.map(([k, list]) => (
          <section key={k} className="space-y-2">
            <h2 className="font-bold">{dayLabel(new Date(list[0].eaten_at))}</h2>
            {list.map((m) => (
              <article key={m.id} className={card}>
                <div className="flex items-center justify-between"><span className="font-bold text-sagedeep">{m.meal_type ? `${MEAL_TYPE_LABEL[m.meal_type]} · ` : ''}{timeLabel(new Date(m.eaten_at))}</span>
                  {m.preference && <span className="rounded-full bg-butter px-3 py-1 text-sm">{PREF_LABEL[m.preference]}</span>}</div>
                <ul className="my-2 flex flex-wrap gap-2">{m.meal_items.map((i) => { const f = foodMap.get(i.food_id); return f && <li key={f.id} className="flex items-center gap-2 rounded-full bg-cream py-1 pl-1 pr-3"><FoodImage food={f} small />{f.name}</li> })}</ul>
                {(m.portion_amount || m.notes) && <p className="text-sm text-ink/70">{m.portion_amount ? `${m.portion_amount} ${m.portion_unit}. ` : ''}{m.notes}</p>}
                {confirm === m.id ? (
                  <div className="mt-3 flex items-center gap-2"><span className="font-semibold">Obrisati obrok?</span><button className={btnDanger} onClick={() => void del(m.id)}>Obriši</button><button className={btnSoft} onClick={() => setConfirm(null)}>Odustani</button></div>
                ) : (
                  <div className="mt-3 flex gap-2"><Link to={`/obrok/${m.id}`} className={btnSoft}><Pencil size={16} aria-hidden />Uredi</Link><button className={btnSoft} onClick={() => setConfirm(m.id)}><Trash2 size={16} aria-hidden />Obriši</button></div>
                )}
              </article>
            ))}
          </section>
        ))}
    </div>
  )
}
