import React, { useEffect, useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../src/constants'
import { useTransactionStore, Transaction, TransactionType } from '../../src/store/transaction.store'
import { useAuthStore } from '../../src/store/auth.store'

// ── Helpers ────────────────────────────────────────────

const TYPE_FILTERS: { key: TransactionType | 'all'; label: string }[] = [
  { key: 'all',      label: 'ทั้งหมด' },
  { key: 'expense',  label: 'รายจ่าย' },
  { key: 'income',   label: 'รายรับ' },
  { key: 'transfer', label: 'โอน' },
]

const TYPE_COLOR: Record<TransactionType, string> = {
  expense:  Colors.error[500],
  income:   Colors.emerald[500],
  transfer: Colors.info[500],
}
const TYPE_DIM: Record<TransactionType, string> = {
  expense:  Colors.error.dim,
  income:   Colors.emerald.dim,
  transfer: Colors.info.dim,
}

function formatAmount(amount: number, type: TransactionType) {
  const abs = Math.abs(amount).toLocaleString('th-TH')
  if (type === 'expense') return `-฿${abs}`
  if (type === 'income')  return `+฿${abs}`
  return `฿${abs}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const MONTHS_TH = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]

// ── Sub Components ─────────────────────────────────────

function TransactionRow({ item }: { item: Transaction }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(app)/transaction/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: TYPE_DIM[item.type] }]}>
        <Text style={styles.rowIconText}>
          {item.type === 'expense' ? '↑' : item.type === 'income' ? '↓' : '⇄'}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowCategory}>{item.category}</Text>
        {!!item.note && <Text style={styles.rowNote} numberOfLines={1}>{item.note}</Text>}
        <Text style={styles.rowDate}>{formatDate(item.date)}  {formatTime(item.date)}</Text>
      </View>
      <Text style={[styles.rowAmount, { color: TYPE_COLOR[item.type] }]}>
        {formatAmount(item.amount, item.type)}
      </Text>
    </TouchableOpacity>
  )
}

function SectionHeader({ title, income, expense }: { title: string; income: number; expense: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionSummary}>
        <Text style={styles.sectionIncome}>+฿{income.toLocaleString('th-TH')}</Text>
        <Text style={styles.sectionExpense}>-฿{expense.toLocaleString('th-TH')}</Text>
      </View>
    </View>
  )
}

// ── Main Screen ────────────────────────────────────────

export default function HistoryScreen() {
  const allTransactions = useTransactionStore(s => s.allTransactions)
  const loadingAll      = useTransactionStore(s => s.loadingAll)
  const fetchAll        = useTransactionStore(s => s.fetchAll)
  const session         = useAuthStore(s => s.session)

  const now = new Date()
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  useEffect(() => {
    if (!session?.access_token) return
    fetchAll({ type: typeFilter, year, month })
  }, [session?.access_token, typeFilter, year, month])

  // จัดกลุ่มตามวัน
  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {}
    for (const tx of allTransactions) {
      const key = tx.date.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(tx)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [allTransactions])

  // Summary
  const totalIncome  = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
    if (isCurrentMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประวัติรายการ</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Month Picker */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS_TH[month - 1]} {year + 543}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.monthArrow}
          disabled={year === now.getFullYear() && month === now.getMonth() + 1}
        >
          <Text style={[
            styles.monthArrowText,
            year === now.getFullYear() && month === now.getMonth() + 1 && styles.monthArrowDisabled,
          ]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>รายรับ</Text>
          <Text style={[styles.summaryItemVal, { color: Colors.emerald[400] }]}>
            +฿{totalIncome.toLocaleString('th-TH')}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>รายจ่าย</Text>
          <Text style={[styles.summaryItemVal, { color: Colors.error[400] }]}>
            -฿{totalExpense.toLocaleString('th-TH')}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>คงเหลือ</Text>
          <Text style={[
            styles.summaryItemVal,
            { color: totalIncome - totalExpense >= 0 ? Colors.emerald[400] : Colors.error[400] },
          ]}>
            ฿{(totalIncome - totalExpense).toLocaleString('th-TH')}
          </Text>
        </View>
      </View>

      {/* Type Filter */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, typeFilter === f.key && styles.filterChipActive]}
            onPress={() => setTypeFilter(f.key)}
          >
            <Text style={[styles.filterChipText, typeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loadingAll ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.emerald[500]} size="large" />
        </View>
      ) : grouped.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>ไม่มีรายการในเดือนนี้</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([date]) => date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: [date, txs] }) => {
            const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            const d = new Date(date)
            const title = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
            return (
              <View>
                <SectionHeader title={title} income={inc} expense={exp} />
                {txs.map(tx => <TransactionRow key={tx.id} item={tx} />)}
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backBtn: { padding: 4, marginRight: 8 },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { flex: 1, ...TextStyles.h2, fontSize: 18 },

  // Month
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: Spacing[2],
  },
  monthArrow: { padding: 8 },
  monthArrowText: { fontSize: 26, color: Colors.text.primary, lineHeight: 30 },
  monthArrowDisabled: { color: Colors.text.disabled },
  monthLabel: { ...TextStyles.h3, fontSize: 16, minWidth: 160, textAlign: 'center' },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing[4],
    marginVertical: Spacing[3],
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: Spacing[3],
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryItemLabel: { ...TextStyles.caption, color: Colors.text.muted },
  summaryItemVal: { ...TextStyles.monoMd, fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: Colors.border.default, marginVertical: 4 },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.emerald.dim,
    borderColor: Colors.emerald[500],
  },
  filterChipText: { ...TextStyles.bodySm, fontSize: 12, color: Colors.text.muted },
  filterChipTextActive: { color: Colors.emerald[400], fontWeight: '700' },

  // List
  listContent: { paddingHorizontal: Spacing[4], paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    marginTop: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    marginBottom: 4,
  },
  sectionTitle: { ...TextStyles.bodySm, color: Colors.text.muted },
  sectionSummary: { flexDirection: 'row', gap: 8 },
  sectionIncome: { ...TextStyles.monoSm, color: Colors.emerald[500], fontSize: 11 },
  sectionExpense: { ...TextStyles.monoSm, color: Colors.error[500], fontSize: 11 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: { fontSize: 18, color: Colors.text.primary },
  rowBody: { flex: 1 },
  rowCategory: { ...TextStyles.bodyLg, fontSize: 14, color: Colors.text.primary },
  rowNote: { ...TextStyles.bodySm, fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  rowDate: { ...TextStyles.monoSm, fontSize: 10, color: Colors.text.disabled, marginTop: 2 },
  rowAmount: { ...TextStyles.monoMd, fontSize: 14, fontWeight: '700' },

  // Empty / Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...TextStyles.bodyMd, color: Colors.text.muted },
})
