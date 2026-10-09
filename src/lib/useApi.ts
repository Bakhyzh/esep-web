import { useCallback, useEffect, useEffectEvent, useState } from 'react'

export interface ApiState<T> { data: T | null; error: unknown; loading: boolean; reload: () => void }

type Dep = string | number | boolean | null | undefined

interface Loaded<T> { key: string | null; data: T | null; error: unknown }

/**
 * Loads data whenever `deps` (primitive values) change and aborts the previous request,
 * so a slow old response can never overwrite a newer one (e.g. when filters change quickly).
 * The previous data stays visible while the next request runs; `loading` is derived, not stored.
 */
export function useApi<T>(loader: (signal: AbortSignal) => Promise<T>, deps: readonly Dep[]): ApiState<T> {
  const [version, setVersion] = useState(0)
  const key = JSON.stringify([...deps, version])
  const [state, setState] = useState<Loaded<T>>({ key: null, data: null, error: null })

  // always calls the latest loader without making the effect re-run on every render
  const load = useEffectEvent((signal: AbortSignal) => loader(signal))

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(
      data => { if (!controller.signal.aborted) setState({ key, data, error: null }) },
      error => { if (!controller.signal.aborted) setState(prev => ({ key, data: prev.data, error })) },
    )
    return () => controller.abort()
  }, [key])

  const reload = useCallback(() => setVersion(v => v + 1), [])
  return { data: state.data, error: state.key === key ? state.error : null, loading: state.key !== key, reload }
}
