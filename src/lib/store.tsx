import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase, errText } from './supabase'
import type { Food, Meal } from '../types'

interface Store { foods: Food[]; foodMap: Map<string, Food>; meals: Meal[]; loading: boolean; error: string | null; reload: () => Promise<void> }
const Ctx = createContext<Store | null>(null)
export function useStore() { const c = useContext(Ctx); if (!c) throw new Error('StoreProvider nedostaje'); return c }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [foods, setFoods] = useState<Food[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [f, m] = await Promise.all([
        supabase.from('foods').select('id,name,category,emoji,image_url,description').order('name').limit(1000),
        supabase.from('meals').select('id,eaten_at,meal_type,preference,notes,portion_amount,portion_unit,meal_items(food_id)').order('eaten_at', { ascending: false }).limit(1000),
      ])
      if (f.error) throw f.error
      if (m.error) throw m.error
      setFoods(f.data as Food[]); setMeals(m.data as unknown as Meal[]); setError(null)
    } catch (e) { setError(errText(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void reload() }, [reload])

  const foodMap = useMemo(() => new Map(foods.map((x) => [x.id, x])), [foods])
  return <Ctx.Provider value={{ foods, foodMap, meals, loading, error, reload }}>{children}</Ctx.Provider>
}
