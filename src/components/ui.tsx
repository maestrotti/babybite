import { Component, useEffect, useState, type ReactNode } from 'react'
import type { Category, Food } from '../types'

export const card = 'rounded-3xl bg-white p-4 shadow-[0_6px_20px_rgba(120,80,60,.08)]'
const btn = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold transition active:scale-95 disabled:opacity-50 disabled:active:scale-100'
export const btnPrimary = `${btn} bg-sagedeep text-white`
export const btnSoft = `${btn} bg-sage text-ink`
export const btnDanger = `${btn} bg-red-700 text-white`
export const input = 'min-h-12 w-full rounded-2xl border border-ink/20 bg-white px-4 outline-none focus:border-sagedeep'

const TINT: Record<Category, string> = {
  'Voće': 'bg-blush/60', 'Povrće': 'bg-sage/70', 'Žitarice': 'bg-butter/80', 'Meso': 'bg-peach/80', 'Riba': 'bg-sky/80',
  'Mliječni proizvodi': 'bg-sky/40', 'Mahunarke': 'bg-peach/50', 'Jaja': 'bg-butter/60', 'Orašasti plodovi i sjemenke': 'bg-peach/60', 'Ostalo': 'bg-sage/40',
}

/** Fotografija ako postoji image_url; inače (ili pri grešci) ilustracija u emoji obliku. */
export function FoodImage({ food, small = false }: { food: Food; small?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'err'>(food.image_url ? 'loading' : 'err')
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${small ? 'h-10 w-10 rounded-xl text-xl' : 'aspect-square w-full rounded-2xl text-5xl'} ${TINT[food.category]} ${state === 'loading' ? 'animate-pulse' : ''}`}>
      {food.image_url && state !== 'err' && (
        <img src={food.image_url} alt={food.name} loading="lazy" onLoad={() => setState('ok')} onError={() => setState('err')} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {state === 'err' && <span role="img" aria-label={food.name}>{food.emoji ?? '🍽️'}</span>}
    </div>
  )
}

export const Spinner = () => <div role="status" className="py-10 text-center text-ink/60">Učitavanje…</div>
export const ErrorBox = ({ text, onRetry }: { text: string; onRetry?: () => void }) => (
  <div role="alert" className="rounded-2xl bg-red-50 p-4 text-red-800">{text}{onRetry && <button onClick={onRetry} className="ml-2 font-semibold underline">Pokušaj ponovo</button>}</div>
)
export const Empty = ({ emoji, title, text, children }: { emoji: string; title: string; text?: string; children?: ReactNode }) => (
  <div className={`${card} flex flex-col items-center gap-2 py-8 text-center`}>
    <div className="text-5xl">{emoji}</div><h2 className="text-lg font-bold">{title}</h2>
    {text && <p className="max-w-xs text-ink/70">{text}</p>}{children}
  </div>
)

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => {
    const u = () => setOn(true), d = () => setOn(false)
    window.addEventListener('online', u); window.addEventListener('offline', d)
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', d) }
  }, [])
  return on
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <div className="p-6 text-center"><p className="mb-4 text-lg font-bold">Nešto je pošlo po zlu.</p><button className={btnPrimary} onClick={() => location.reload()}>Osvježi aplikaciju</button></div>
      : this.props.children
  }
}
