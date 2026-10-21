import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, X } from 'lucide-react'
import { supabase, errText } from '../lib/supabase'
import { useStore } from '../lib/store'
import { toggleFood, toLocalInput, validateMeal, whenLabel } from '../lib/meal'
import { PREF_LABEL, type Meal, type Pref } from '../types'
import { FoodPicker } from '../components/FoodPicker'
import { ErrorBox, FoodImage, Spinner, btnPrimary, card, input, useOnline } from '../components/ui'

export default function MealForm() {
  const { id } = useParams()
  const { meals, loading } = useStore()
  const existing = id ? meals.find((m) => m.id === id) : undefined
  if (id && loading) return <Spinner />
  if (id && !existing) return <ErrorBox text="Obrok nije pronađen." />
  // key osigurava svjež state pri promjeni obroka
  return <Form key={id ?? 'novi'} meal={existing} />
}

function Form({ meal }: { meal?: Meal }) {
  const nav = useNavigate()
  const online = useOnline()
  const { foodMap, reload } = useStore()
  // Vrijeme se hvata u trenutku kad roditelj otvori "Dodaj obrok"; ID štiti od duplikata pri dvostrukom kliku.
  const [mealId] = useState(() => meal?.id ?? crypto.randomUUID())
  const [selected, setSelected] = useState<string[]>(meal?.meal_items.map((i) => i.food_id) ?? [])
  const [eatenAt, setEatenAt] = useState(() => toLocalInput(meal ? new Date(meal.eaten_at) : new Date()))
  const [pref, setPref] = useState<Pref>(meal?.preference ?? null)
  const [notes, setNotes] = useState(meal?.notes ?? '')
  const [amount, setAmount] = useState(meal?.portion_amount?.toString() ?? '')
  const [unit, setUnit] = useState<'g' | 'ml' | 'kašika'>(meal?.portion_unit ?? 'g')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const when = useMemo(() => new Date(eatenAt), [eatenAt])

  async function save() {
    if (busy || done) return
    const problem = validateMeal({ foodIds: selected, eatenAt: when, amount })
    if (problem) return setError(problem)
    if (!online) return setError('Za spremanje je potrebna internet veza.')
    setBusy(true); setError(null)
    const { error } = await supabase.rpc('save_meal', {
      p_meal_id: mealId, p_eaten_at: when.toISOString(), p_preference: pref, p_notes: notes,
      p_portion_amount: amount ? Number(amount) : null, p_portion_unit: amount ? unit : null, p_food_ids: selected,
    })
    if (error) { setBusy(false); return setError(errText(error)) }
    await reload(); setDone(true)
    setTimeout(() => nav(meal ? '/historija' : '/'), 800)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{meal ? 'Uredi obrok' : 'Dodaj obrok'}</h1>
      <section className={card} aria-label="Odabrano">
        <h2 className="mb-2 font-bold">Odabrano ({selected.length})</h2>
        {selected.length === 0 ? <p className="text-ink/70">Dodirnite slike namirnica ispod. Možete odabrati više njih za jedan obrok.</p> : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((fid) => { const f = foodMap.get(fid); return f && (
              <li key={fid} className="flex items-center gap-2 rounded-full bg-sage py-1 pl-1 pr-2"><FoodImage food={f} small /><span className="font-semibold">{f.name}</span>
                <button aria-label={`Ukloni ${f.name}`} className="grid h-8 w-8 place-items-center" onClick={() => setSelected(toggleFood(selected, fid))}><X size={18} /></button></li>
            ) })}
          </ul>
        )}
      </section>
      <FoodPicker selected={selected} onToggle={(fid) => setSelected(toggleFood(selected, fid))} />
      <section className={`${card} space-y-4`}>
        <div>
          <label className="mb-1 flex items-center gap-2 font-bold" htmlFor="vrijeme"><Clock size={18} aria-hidden />Vrijeme obroka: {Number.isNaN(when.getTime()) ? '—' : whenLabel(when.toISOString())}</label>
          <input id="vrijeme" type="datetime-local" className={input} value={eatenAt} onChange={(e) => setEatenAt(e.target.value)} />
          <p className="mt-1 text-sm text-ink/60">Vrijeme je upisano automatski. Dodirnite polje da ga ispravite.</p>
        </div>
        <fieldset>
          <legend className="mb-1 font-bold">Kako mu se svidjelo? <span className="font-normal text-ink/60">(nije obavezno)</span></legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PREF_LABEL) as ('liked' | 'disliked' | 'unsure')[]).map((p) => (
              <button key={p} type="button" aria-pressed={pref === p} onClick={() => setPref(pref === p ? null : p)}
                className={`min-h-12 rounded-full px-4 font-semibold ${pref === p ? 'bg-sagedeep text-white' : 'bg-cream'}`}>{PREF_LABEL[p]}</button>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-2">
          <input className={input} inputMode="decimal" placeholder="Količina" aria-label="Količina" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} />
          <select className={`${input} max-w-28`} aria-label="Jedinica" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}><option>g</option><option>ml</option><option>kašika</option></select>
        </div>
        <textarea className={`${input} py-3`} rows={2} maxLength={500} placeholder="Napomena (npr. prvi put, sa kašikom)" aria-label="Napomena" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <ErrorBox text={error} />}
        {done && <div role="status" className="rounded-2xl bg-sage p-3 font-semibold">Obrok je spremljen ✓</div>}
        <button className={`${btnPrimary} w-full`} onClick={() => void save()} disabled={busy || done || !online}>{busy ? 'Spremanje…' : meal ? 'Spremi izmjene' : 'Spremi obrok'}</button>
      </section>
    </div>
  )
}
