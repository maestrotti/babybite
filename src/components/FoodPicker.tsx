import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { CATEGORIES, type Category } from '../types'
import { useStore } from '../lib/store'
import { FoodImage, Empty, input } from './ui'

const PAGE = 30
export function FoodPicker({ selected = [], onToggle, tried }: { selected?: string[]; onToggle?: (id: string) => void; tried?: Set<string> }) {
  const { foods } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | ''>('')
  const [limit, setLimit] = useState(PAGE)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return foods.filter((f) => (!cat || f.category === cat) && (!s || f.name.toLowerCase().includes(s)))
  }, [foods, q, cat])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-ink/50" size={20} aria-hidden />
        <input className={`${input} pl-11`} placeholder="Pretraži namirnice" aria-label="Pretraga namirnica" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Kategorije">
        {(['', ...CATEGORIES] as const).map((c) => (
          <button key={c || 'sve'} onClick={() => { setCat(c); setLimit(PAGE) }} aria-pressed={cat === c}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${cat === c ? 'bg-sagedeep text-white' : 'bg-white text-ink'}`}>{c || 'Sve'}</button>
        ))}
      </div>
      {list.length === 0 ? <Empty emoji="🔍" title="Nema rezultata" text="Probajte drugu riječ ili kategoriju." /> : (
        <ul className="grid grid-cols-3 gap-3">
          {list.slice(0, limit).map((f) => {
            const on = selected.includes(f.id)
            const inner = (
              <>
                <FoodImage food={f} />
                {on && <span className="absolute right-2 top-2 rounded-full bg-sagedeep p-1 text-white"><Check size={16} aria-label="Odabrano" /></span>}
                <span className="mt-1 block truncate text-sm font-semibold">{f.name}</span>
                {tried?.has(f.id) && <span className="text-xs text-sagedeep">Probano</span>}
              </>
            )
            const cls = `relative block w-full rounded-2xl bg-white p-1.5 text-center shadow-sm ${on ? 'ring-4 ring-sagedeep' : ''}`
            return (
              <li key={f.id}>
                {onToggle
                  ? <button type="button" aria-pressed={on} onClick={() => onToggle(f.id)} className={cls}>{inner}</button>
                  : <div className={cls}>{inner}</div>}
              </li>
            )
          })}
        </ul>
      )}
      {list.length > limit && <button className="mx-auto block min-h-12 rounded-full bg-sage px-6 font-semibold" onClick={() => setLimit(limit + PAGE)}>Prikaži još</button>}
    </div>
  )
}
