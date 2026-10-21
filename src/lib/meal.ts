import type { Meal } from '../types'

const MJESECI = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar']
const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota']
const pad = (n: number) => String(n).padStart(2, '0')

export const toggleFood = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])

export function validateMeal(o: { foodIds: string[]; eatenAt: Date; amount?: string; now?: Date }): string | null {
  if (o.foodIds.length === 0) return 'Odaberite barem jednu namirnicu.'
  if (Number.isNaN(o.eatenAt.getTime())) return 'Unesite ispravan datum i vrijeme.'
  if (o.eatenAt.getTime() > (o.now ?? new Date()).getTime() + 5 * 60_000) return 'Vrijeme obroka ne može biti u budućnosti.'
  if (o.amount && !(Number(o.amount) > 0 && Number(o.amount) <= 5000)) return 'Količina mora biti broj veći od 0.'
  return null
}

export const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${timeLabel(d)}`
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const longDate = (d: Date) => `${DANI[d.getDay()]}, ${d.getDate()}. ${MJESECI[d.getMonth()]} ${d.getFullYear()}.`

export function dayLabel(d: Date, now = new Date()): string {
  const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5)
  if (diff === 0) return 'Danas'
  if (diff === 1) return 'Jučer'
  return `${d.getDate()}. ${MJESECI[d.getMonth()]} ${d.getFullYear()}.`
}
export const whenLabel = (iso: string) => `${dayLabel(new Date(iso))}, ${timeLabel(new Date(iso))}`

export function countFoods(meals: Pick<Meal, 'meal_items'>[]): [string, number][] {
  const c = new Map<string, number>()
  for (const m of meals) for (const i of m.meal_items) c.set(i.food_id, (c.get(i.food_id) ?? 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1])
}

/** Datum prvog jedenja svake namirnice (ISO). */
export function firstEaten(meals: Pick<Meal, 'eaten_at' | 'meal_items'>[]): Map<string, string> {
  const f = new Map<string, string>()
  for (const m of meals) for (const i of m.meal_items) { const p = f.get(i.food_id); if (!p || m.eaten_at < p) f.set(i.food_id, m.eaten_at) }
  return f
}
