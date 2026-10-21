import { firstEaten } from '../lib/meal'
import { useStore } from '../lib/store'
import { FoodPicker } from '../components/FoodPicker'
import { ErrorBox, Spinner } from '../components/ui'

export default function Foods() {
  const { meals, loading, error, reload } = useStore()
  if (loading) return <Spinner />
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Namirnice</h1>
      {error && <ErrorBox text={error} onRetry={() => void reload()} />}
      <FoodPicker tried={new Set(firstEaten(meals).keys())} />
    </div>
  )
}
