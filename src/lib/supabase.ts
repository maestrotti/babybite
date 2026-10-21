import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const configured = Boolean(url && key)
// Samo javni (anon) ključ; sigurnost obezbjeđuje RLS u bazi.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', { auth: { flowType: 'pkce' } })
export const appUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`

const ERR: Record<string, string> = {
  'Invalid login credentials': 'Pogrešan e-mail ili lozinka.',
  'User already registered': 'Račun s ovom e-mail adresom već postoji.',
  'Email not confirmed': 'Potvrdite e-mail adresu klikom na link koji smo poslali.',
  'Password should be at least 6 characters': 'Lozinka mora imati najmanje 6 znakova.',
}
export function errText(e: unknown): string {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : ''
  if (/fetch|network/i.test(m)) return 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.'
  if (/jwt|expired/i.test(m)) return 'Sesija je istekla. Prijavite se ponovo.'
  return ERR[m] ?? (m || 'Došlo je do greške. Pokušajte ponovo.')
}
