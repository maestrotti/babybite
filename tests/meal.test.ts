import { describe, expect, it } from 'vitest'
import { countFoods, dayLabel, firstEaten, toggleFood, validateMeal } from '../src/lib/meal'

const now = new Date(2026, 9, 19, 12, 0)
describe('odabir namirnica', () => {
  it('dodaje i uklanja', () => {
    expect(toggleFood([], 'a')).toEqual(['a'])
    expect(toggleFood(['a', 'b'], 'a')).toEqual(['b'])
  })
})
describe('validacija obroka', () => {
  it('traži namirnicu', () => expect(validateMeal({ foodIds: [], eatenAt: now, now })).toMatch(/namirnicu/))
  it('odbija budućnost', () => expect(validateMeal({ foodIds: ['a'], eatenAt: new Date(2026, 9, 20), now })).toMatch(/budućnosti/))
  it('odbija neispravnu količinu', () => expect(validateMeal({ foodIds: ['a'], eatenAt: now, amount: '-3', now })).toMatch(/Količina/))
  it('prihvata ispravan obrok', () => expect(validateMeal({ foodIds: ['a'], eatenAt: now, amount: '50', now })).toBeNull())
})
describe('datumi i statistika', () => {
  it('Danas / Jučer / datum', () => {
    expect(dayLabel(new Date(2026, 9, 19, 8), now)).toBe('Danas')
    expect(dayLabel(new Date(2026, 9, 18, 8), now)).toBe('Jučer')
    expect(dayLabel(new Date(2026, 9, 1, 8), now)).toBe('1. oktobar 2026.')
  })
  const meals = [
    { eaten_at: '2026-10-02T08:00:00Z', meal_items: [{ food_id: 'a' }, { food_id: 'b' }] },
    { eaten_at: '2026-10-01T08:00:00Z', meal_items: [{ food_id: 'a' }] },
  ]
  it('broji namirnice', () => expect(countFoods(meals)[0]).toEqual(['a', 2]))
  it('nalazi prvo jedenje', () => expect(firstEaten(meals).get('a')).toBe('2026-10-01T08:00:00Z'))
})
