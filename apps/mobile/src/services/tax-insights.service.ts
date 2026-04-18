import { api } from './api.client'

export interface TaxInsightBreakdown {
  categoryId:   string | null
  categoryName: string
  categorySlug: string | null
  amount:       number
  count:        number
}

export interface TaxInsightMonthly {
  month:  string      // 'YYYY-MM'
  amount: number
  count:  number
}

export interface TaxInsight {
  year:        number
  totalAmount: number
  totalCount:  number
  breakdown:   TaxInsightBreakdown[]
  monthly:     TaxInsightMonthly[]
}

export async function fetchTaxInsights(year?: number): Promise<TaxInsight> {
  const qs = year ? `?year=${year}` : ''
  const res = await api.get(`/tax/insights${qs}`)
  return res.data
}
