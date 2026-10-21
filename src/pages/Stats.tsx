import { useStore } from '../lib/store'
import { countFoods, dayKey, firstEaten } from '../lib/meal'
import { Empty, FoodImage, Spinner, card } from '../components/ui'

export default function Stats() {
  const { meals, foodMap, loading } = useStore()
  if (loading) return <Spinner />
  if (meals.length === 0) return <div className="space-y-4"><h1 className="text-2xl font-extrabold">Statistika</h1><Empty emoji="📊" title="Još nema podataka" text="Statistika se prikazuje čim zabilježite prvi obrok." /></div>
  const top = countFoods(meals).slice(0, 5)
  const liked = countFoods(meals.filter((m) => m.preference === 'liked')).slice(0, 6)
  const disliked = countFoods(meals.filter((m) => m.preference === 'disliked')).slice(0, 6)
  const first = firstEaten(meals)
  const recent = [...first.entries()].sort((a, b) => b[1].localeCompare(a[1])).slice(0, 6)
  const now = new Date()
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (6 - i)); return { d, n: meals.filter((m) => dayKey(new Date(m.eaten_at)) === dayKey(d)).length } })
  const max = Math.max(1, ...week.map((w) => w.n))
  const chips = (rows: [string, number][]) => rows.length === 0 ? <p className="text-ink/70">Još nema podataka.</p> : (
    <ul className="flex flex-wrap gap-2">{rows.map(([id, n]) => { const f = foodMap.get(id); return f && <li key={id} className="flex items-center gap-2 rounded-full bg-cream py-1 pl-1 pr-3"><FoodImage food={f} small />{f.name} <span className="text-ink/60">×{n}</span></li> })}</ul>
  )
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Statistika</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className={`${card} bg-butter`}><div className="text-3xl font-extrabold">{meals.length}</div>obroka ukupno</div>
        <div className={`${card} bg-sky/60`}><div className="text-3xl font-extrabold">{first.size}</div>različitih namirnica</div>
      </div>
      <section className={card}><h2 className="mb-2 font-bold">Najčešće namirnice</h2>
        <ul className="space-y-2">{top.map(([id, n]) => <li key={id}><div className="flex justify-between text-sm"><span>{foodMap.get(id)?.name}</span><span>{n}</span></div><div className="h-3 rounded-full bg-cream"><div className="h-3 rounded-full bg-sagedeep" style={{ width: `${(n / top[0][1]) * 100}%` }} /></div></li>)}</ul></section>
      <section className={card}><h2 className="mb-2 font-bold">Obroci koji su mu se svidjeli</h2>{chips(liked)}</section>
      <section className={card}><h2 className="mb-2 font-bold">Obroci koji mu se nisu svidjeli</h2>{chips(disliked)}
        <p className="mt-3 text-xs text-ink/60">Ocjena se odnosi na cijeli obrok, ne na pojedinu namirnicu. Ovo nije medicinski savjet i ne govori ništa o alergijama ili ishrani; za takva pitanja obratite se pedijatru.</p></section>
      <section className={card}><h2 className="mb-2 font-bold">Obroci po danima (7 dana)</h2>
        <ul className="flex h-28 items-end gap-2">{week.map(({ d, n }) => <li key={dayKey(d)} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-xs">{n}</span><div className="w-full rounded-t-lg bg-blush" style={{ height: `${(n / max) * 80 + 4}px` }} /><span className="text-xs text-ink/60">{['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'][d.getDay()]}</span></li>)}</ul></section>
      <section className={card}><h2 className="mb-2 font-bold">Nedavno uvedene namirnice</h2>{chips(recent.map(([id]) => [id, countFoods(meals).find((c) => c[0] === id)?.[1] ?? 1]))}</section>
    </div>
  )
}
