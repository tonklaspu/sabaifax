import React, { useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import { Header } from '../../../src/components'
import { useTaxInsights } from '../../../src/hooks/useTaxInsights'
import { TaxInsightBreakdown, TaxInsightMonthly } from '../../../src/services/tax-insights.service'

// ── Helpers ───────────────────────────────────────

function fmt(n: number) {
  return Math.round(n).toLocaleString('th-TH')
}

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function monthLabel(ym: string): string {
  const [, mm] = ym.split('-')
  const idx = Number(mm) - 1
  return THAI_MONTHS[idx] ?? ym
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜', transport: '🚗', shopping: '🛍️', health: '💊',
  entertainment: '🎮', housing: '🏠', utility: '💡', other: '📦',
}

// ── Sub Components ────────────────────────────────

function YearSelector({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const currentYear = new Date().getFullYear()
  const canNext = year < currentYear
  return (
    <View style={styles.yearRow}>
      <TouchableOpacity style={styles.yearBtn} onPress={() => onChange(year - 1)} activeOpacity={0.7}>
        <Text style={styles.yearBtnText}>‹</Text>
      </TouchableOpacity>
      <View style={styles.yearPill}>
        <Text style={styles.yearLabel}>ปีภาษี</Text>
        <Text style={styles.yearValue}>{year + 543}</Text>
      </View>
      <TouchableOpacity
        style={[styles.yearBtn, !canNext && styles.yearBtnDisabled]}
        onPress={() => canNext && onChange(year + 1)}
        activeOpacity={canNext ? 0.7 : 1}
        disabled={!canNext}
      >
        <Text style={[styles.yearBtnText, !canNext && { opacity: 0.3 }]}>›</Text>
      </TouchableOpacity>
    </View>
  )
}

function TotalCard({ amount, count }: { amount: number; count: number }) {
  return (
    <View style={styles.totalCard}>
      <Text style={styles.totalLabel}>ค่าลดหย่อนสะสมปีนี้</Text>
      <View style={styles.totalRow}>
        <Text style={styles.totalCurrency}>฿</Text>
        <Text style={styles.totalAmount}>{fmt(amount)}</Text>
      </View>
      <Text style={styles.totalSub}>จาก {count.toLocaleString('th-TH')} รายการ</Text>
    </View>
  )
}

function BreakdownRow({ item, maxAmount }: { item: TaxInsightBreakdown; maxAmount: number }) {
  const icon = (item.categorySlug && CATEGORY_ICONS[item.categorySlug]) ?? '📦'
  const pct  = maxAmount > 0 ? (item.amount / maxAmount) : 0
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHead}>
        <Text style={styles.breakdownIcon}>{icon}</Text>
        <Text style={styles.breakdownName} numberOfLines={1}>{item.categoryName}</Text>
        <Text style={styles.breakdownAmt}>฿{fmt(item.amount)}</Text>
      </View>
      <View style={styles.breakdownBarTrack}>
        <View style={[styles.breakdownBarFill, { width: `${pct * 100}%` as any }]} />
      </View>
      <Text style={styles.breakdownCount}>{item.count} รายการ</Text>
    </View>
  )
}

function MonthlyBar({ item, maxAmount }: { item: TaxInsightMonthly; maxAmount: number }) {
  const pct = maxAmount > 0 ? (item.amount / maxAmount) : 0
  return (
    <View style={styles.monthBar}>
      <View style={styles.monthBarTrack}>
        <View style={[styles.monthBarFill, { height: `${Math.max(pct * 100, 3)}%` as any }]} />
      </View>
      <Text style={styles.monthLabel}>{monthLabel(item.month)}</Text>
      <Text style={styles.monthAmt}>฿{fmt(item.amount)}</Text>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────

export default function TaxInsightsScreen() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, loading, error, refresh } = useTaxInsights(year)

  const sortedBreakdown = useMemo(
    () => [...(data?.breakdown ?? [])].sort((a, b) => b.amount - a.amount),
    [data?.breakdown],
  )
  const maxBreakdown = sortedBreakdown[0]?.amount ?? 0
  const maxMonthly   = useMemo(
    () => (data?.monthly ?? []).reduce((m, x) => Math.max(m, x.amount), 0),
    [data?.monthly],
  )

  const isEmpty = !loading && data && data.totalCount === 0

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
      <Header title="สรุปค่าลดหย่อนภาษี" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.emerald[400]} />}
      >
        <YearSelector year={year} onChange={setYear} />

        {loading && !data && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.emerald[400]} size="large" />
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {data && (
          <>
            <TotalCard amount={data.totalAmount} count={data.totalCount} />

            {isEmpty ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🧾</Text>
                <Text style={styles.emptyTitle}>ยังไม่มีรายการลดหย่อนภาษี</Text>
                <Text style={styles.emptySub}>
                  เมื่อเพิ่มรายการและติ๊ก "ลดหย่อนภาษี" ระบบจะสรุปให้อัตโนมัติ
                </Text>
              </View>
            ) : (
              <>
                {/* Breakdown */}
                <Text style={styles.sectionHeader}>แยกตามหมวดหมู่</Text>
                <View style={styles.card}>
                  {sortedBreakdown.map((item, i) => (
                    <React.Fragment key={item.categoryId ?? `unknown-${i}`}>
                      <BreakdownRow item={item} maxAmount={maxBreakdown} />
                      {i < sortedBreakdown.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                </View>

                {/* Monthly */}
                {data.monthly.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>เดือนต่อเดือน</Text>
                    <View style={styles.monthlyCard}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
                      >
                        {data.monthly.map(m => (
                          <MonthlyBar key={m.month} item={m} maxAmount={maxMonthly} />
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  scroll: { paddingHorizontal: Spacing[4], paddingTop: Spacing[2], gap: 12 },

  // Year
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  yearBtn: {
    width: 40, height: 40, borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  yearBtnDisabled: { opacity: 0.4 },
  yearBtnText: { fontSize: 20, color: Colors.text.primary, fontWeight: '600' },
  yearPill: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.navy[500], borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.border.default,
    paddingVertical: Spacing[2],
  },
  yearLabel: { ...TextStyles.bodySm, fontSize: 10, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  yearValue: { ...TextStyles.h2, fontSize: 20, color: Colors.emerald[400], marginTop: 2 },

  // Total card
  totalCard: {
    backgroundColor: Colors.emerald.dim,
    borderWidth: 1, borderColor: Colors.emerald.border,
    borderRadius: Radius['3xl'],
    padding: Spacing[5],
    alignItems: 'center',
  },
  totalLabel: { ...TextStyles.bodySm, fontSize: 11, color: Colors.emerald[400], textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 8 },
  totalCurrency: { fontSize: 20, color: Colors.emerald[400], fontWeight: '600', paddingBottom: 6 },
  totalAmount: { fontSize: 40, color: Colors.emerald[400], fontWeight: '700', lineHeight: 44 },
  totalSub: { ...TextStyles.bodySm, color: Colors.text.muted, marginTop: 6 },

  // Section
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: Colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 4, paddingTop: Spacing[2],
  },
  card: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.border.default,
    padding: Spacing[3],
  },
  divider: { height: 1, backgroundColor: Colors.border.subtle, marginVertical: Spacing[2] },

  // Breakdown
  breakdownRow: { gap: 6, paddingVertical: 4 },
  breakdownHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownIcon: { fontSize: 18 },
  breakdownName: { flex: 1, ...TextStyles.bodyLg, fontSize: 14, color: Colors.text.primary },
  breakdownAmt: { ...TextStyles.bodyLg, fontSize: 14, color: Colors.emerald[400], fontWeight: '600' },
  breakdownBarTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  breakdownBarFill: { height: '100%', backgroundColor: Colors.emerald[500], borderRadius: 3 },
  breakdownCount: { ...TextStyles.bodySm, fontSize: 10, color: Colors.text.muted },

  // Monthly
  monthlyCard: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.border.default,
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[2],
    minHeight: 160,
  },
  monthBar: { width: 56, alignItems: 'center', gap: 4 },
  monthBarTrack: {
    width: 24, height: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  monthBarFill: { width: '100%', backgroundColor: Colors.emerald[500], borderRadius: 6 },
  monthLabel: { ...TextStyles.bodySm, fontSize: 10, color: Colors.text.muted },
  monthAmt:   { ...TextStyles.bodySm, fontSize: 10, color: Colors.text.primary, fontWeight: '600' },

  // Empty / loading / error
  loadingWrap: { padding: Spacing[6], alignItems: 'center' },
  emptyCard: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius['3xl'],
    borderWidth: 1, borderColor: Colors.border.default,
    padding: Spacing[5], alignItems: 'center', gap: 8,
  },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { ...TextStyles.h3, fontSize: 16 },
  emptySub:   { ...TextStyles.bodySm, color: Colors.text.muted, textAlign: 'center', lineHeight: 18 },
  errorBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.error.dim,
    borderWidth: 1, borderColor: Colors.error.border,
    borderRadius: Radius.card, padding: Spacing[3],
  },
  errorIcon: { fontSize: 18 },
  errorText: { flex: 1, ...TextStyles.bodySm, color: Colors.error[400] },
})
