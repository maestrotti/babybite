import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { dayKey, firstEaten, longDate, timeLabel, whenLabel } from '../lib/meal'
import { MEAL_TYPE_LABEL, PREF_LABEL } from '../types'
import { Empty, ErrorBox, FoodImage, Spinner, btnPrimary, card } from '../components/ui'

export default function Home() {
  const { meals, foodMap, loading, error, reload } = useStore()
  if (loading) return <Spinner />
  const now = new Date()
  const hr = now.getHours()
  const hello = hr < 11 ? 'Dobro jutro' : hr < 18 ? 'Dobar dan' : 'Dobro veče'
  const today = meals.filter((m) => dayKey(new Date(m.eaten_at)) === dayKey(now)).reverse()
  const first = firstEaten(meals)
  const recent = [...first.entries()].filter(([, d]) => now.getTime() - new Date(d).getTime() < 14 * 864e5).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 8)
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (6 - i)); return { d, n: meals.filter((m) => dayKey(new Date(m.eaten_at)) === dayKey(d)).length } })
  const last = meals[0]
  const names = (m: typeof last) => m.meal_items.map((i) => foodMap.get(i.food_id)?.name).filter(Boolean).join(' + ')

  return (
    <div className="space-y-4">
      <header><h1 className="text-2xl font-extrabold">{hello}! 👋</h1><p className="text-ink/70">{longDate(now)}</p></header>
      <Link to="/dodaj" className={`${btnPrimary} w-full text-lg`}><Plus aria-hidden />Dodaj obrok</Link>
      {error && <ErrorBox text={error} onRetry={() => void reload()} />}
      {meals.length === 0 ? <Empty emoji="🥄" title="Još nema obroka" text="Dodajte prvi obrok i ovdje će se pojaviti pregled dana." /> : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className={`${card} bg-butter`}><div className="text-3xl font-extrabold">{today.length}</div><div>obroka danas</div></div>
            <div className={`${card} bg-blush/60`}><div className="text-3xl font-extrabold">{first.size}</div><div>različitih namirnica probano</div></div>
          </section>
          {last && <section className={card}><h2 className="font-bold">Posljednji obrok</h2><p className="text-ink/70">{last.meal_type ? `${MEAL_TYPE_LABEL[last.meal_type]}, ` : ''}{whenLabel(last.eaten_at)}</p><p className="mt-1 font-semibold">{names(last)}</p>{last.preference && <p className="text-sm">{PREF_LABEL[last.preference]}</p>}</section>}
          <section className={card}>
            <h2 className="mb-2 font-bold">Današnji obroci</h2>
            {today.length === 0 ? <p className="text-ink/70">Danas još nema zabilježenih obroka.</p> : (
              <ol className="space-y-3 border-l-2 border-sage pl-4">
                {today.map((m) => <li key={m.id}><div className="text-sm font-semibold text-sagedeep">{m.meal_type ? `${MEAL_TYPE_LABEL[m.meal_type]} · ` : ''}{timeLabel(new Date(m.eaten_at))}</div>
                  <div className="flex flex-wrap gap-1">{m.meal_items.map((i) => { const f = foodMap.get(i.food_id); return f && <FoodImage key={f.id} food={f} small /> })}</div>
                  <div>{names(m)}</div></li>)}
              </ol>
            )}
          </section>
          <section className={card}>
            <h2 className="mb-2 font-bold">Nove namirnice (zadnjih 14 dana)</h2>
            {recent.length === 0 ? <p className="text-ink/70">Nema novih namirnica u posljednje dvije sedmice.</p> : (
              <ul className="flex flex-wrap gap-2">{recent.map(([id]) => { const f = foodMap.get(id); return f && <li key={id} className="flex items-center gap-2 rounded-full bg-sage py-1 pl-1 pr-3"><FoodImage food={f} small />{f.name}</li> })}</ul>
            )}
          </section>
          <section className={card} aria-label="Sedmični pregled">
            <h2 className="mb-2 font-bold">Ova sedmica</h2>
            <ul className="grid grid-cols-7 gap-1 text-center text-sm">
              {week.map(({ d, n }) => <li key={dayKey(d)}><div className={`mx-auto grid h-9 w-9 place-items-center rounded-full font-bold ${n ? 'bg-sagedeep text-white' : 'bg-cream'}`}>{n}</div><div className="mt-1 text-ink/60">{['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'][d.getDay()]}</div></li>)}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
