import { useEffect, useState, useCallback } from 'react'
import { fetchTaxInsights, TaxInsight } from '../services/tax-insights.service'

interface UseTaxInsightsResult {
  data:    TaxInsight | null
  loading: boolean
  error:   string | null
  refresh: () => Promise<void>
}

/**
 * Hook สำหรับ Tax Dashboard — ดึงสรุปค่าลดหย่อนภาษี YTD
 * Usage:
 *   const { data, loading, refresh } = useTaxInsights(2026)
 */
export function useTaxInsights(year?: number): UseTaxInsightsResult {
  const [data,    setData]    = useState<TaxInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await fetchTaxInsights(year)
      setData(d)
    } catch (err: any) {
      setError(err?.message ?? 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, error, refresh }
}
