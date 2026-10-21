export const CATEGORIES = ['Voće', 'Povrće', 'Žitarice', 'Meso', 'Riba', 'Mliječni proizvodi', 'Mahunarke', 'Jaja', 'Orašasti plodovi i sjemenke', 'Ostalo'] as const
export type Category = (typeof CATEGORIES)[number]
export const MEAL_TYPES = ['dorucak', 'rucak', 'vecera'] as const
export type MealType = (typeof MEAL_TYPES)[number]
export const MEAL_TYPE_LABEL: Record<MealType, string> = { dorucak: 'DORUČAK', rucak: 'RUČAK', vecera: 'VEČERA' }
export type Pref = 'liked' | 'disliked' | 'unsure' | null
export interface Food { id: string; name: string; category: Category; emoji: string | null; image_url: string | null; description: string | null }
export interface Meal {
  id: string; eaten_at: string; meal_type: MealType | null; preference: Pref; notes: string | null
  portion_amount: number | null; portion_unit: 'g' | 'ml' | 'kašika' | null
  meal_items: { food_id: string }[]
}
export const PREF_LABEL: Record<'liked' | 'disliked' | 'unsure', string> = {
  liked: 'Svidjelo mu se', disliked: 'Nije mu se svidjelo', unsure: 'Još ne znam',
}
