import { useState, useEffect, useRef } from 'react'

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { execute() }, deps)

  return { data, loading, error, refetch: execute }
}

export function usePagination(fetchFn, initialParams = {}) {
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ total: 0, pages: 0, current_page: 1 })
  const [params, setParams] = useState({ page: 1, per_page: 20, ...initialParams })
  const [loading, setLoading] = useState(true)
  const paramsRef = useRef(params)
  paramsRef.current = params

  const fetch = async (overrideParams) => {
    setLoading(true)
    try {
      const merged = { ...paramsRef.current, ...overrideParams }
      const res = await fetchFn(merged)
      const d = res.data
      // handles any list response key
      const items = d.transactions || d.investigations || d.items || d.data || []
      setData(items)
      setMeta({
        total: d.total ?? 0,
        pages: d.pages ?? 1,
        current_page: d.current_page ?? 1
      })
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [params])

  const updateParams = (updates) =>
    setParams(p => ({ ...p, ...updates, page: 1 }))

  const goToPage = (page) =>
    setParams(p => ({ ...p, page }))

  return { data, meta, params, loading, updateParams, goToPage, refetch: fetch }
}
