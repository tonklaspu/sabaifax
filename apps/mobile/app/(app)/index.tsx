import React, { useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, Shadow, TextStyles } from '../../src/constants'
import { useAuthStore } from '../../src/store/auth.store'
import { useTransactionStore } from '../../src/store/transaction.store'
import { useTaxStore } from '../../src/store/tax.store'
import { useWalletStore } from '../../src/store/wallet.store'
import { MonthlyPie } from '../../src/components/wallet/MonthlyPie'
import { MonthSelector } from '../../src/components/wallet/MonthSelector'

// ── Types ────────────────────────────────────────

type TransactionType = 'expense' | 'income' | 'transfer'

// ── Helpers ────────────────────────────────────────

const formatAmount = (amount: number, type: TransactionType): string => {
  const abs = Math.abs(amount).toLocaleString('th-TH')
  if (type === 'expense') return `-฿${abs}`
  if (type === 'income') return `+฿${abs}`
  return `฿${abs}`
}

const getAmountColor = (type: TransactionType): string => {
  if (type === 'expense') return Colors.error[500]
  if (type === 'income') return Colors.emerald[400]
  return Colors.info[400]
}

const getIconBg = (type: TransactionType): string => {
  if (type === 'expense') return Colors.error.dim
  if (type === 'income') return Colors.emerald.dim
  return Colors.info.dim
}

const getDaysUntilTaxDeadline = (): number => {
  const deadline = new Date(new Date().getFullYear(), 2, 31) // 31 มี.ค.
  const today = new Date()
  const diff = deadline.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ── Sub Components ────────────────────────────────

function Header({ name, initials }: { name: string; initials: string }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerGreeting}>สวัสดี 👋</Text>
        <Text style={styles.headerName}>{name}</Text>
      </View>
      <TouchableOpacity
        style={styles.avatar}
        onPress={() => router.push('/(app)/settings')}
        accessibilityLabel="ไปหน้าตั้งค่า"
        accessibilityRole="button"
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </TouchableOpacity>
    </View>
  )
}

function TaxAlert({ daysLeft }: { daysLeft: number }) {
  // ไม่แสดงถ้าหมดเวลาแล้ว
  if (daysLeft <= 0) return null

  return (
    <View style={styles.taxAlert}>
      <Text style={styles.taxAlertIcon}>📅</Text>
      <View>
        <Text style={styles.taxAlertTitle}>
          ยื่นภาษีภายใน 31 มี.ค. นี้
        </Text>
        <Text style={styles.taxAlertSub}>
          เหลืออีก {daysLeft} วัน
        </Text>
      </View>
    </View>
  )
}

function SummaryCard({
  totalBalance,
  lastUpdated,
}: {
  totalBalance: number
  lastUpdated: string
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>ยอดรวมทุกกระเป๋า</Text>
      <Text style={styles.summaryAmount}>
        ฿{totalBalance.toLocaleString('th-TH')}
      </Text>
      <Text style={styles.summarySub}>อัปเดต {lastUpdated}</Text>
    </View>
  )
}

function MonthlyOverview({
  income, expense, year, month, onChangeMonth,
}: {
  income: number
  expense: number
  year: number
  month: number
  onChangeMonth: (year: number, month: number) => void
}) {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHead}>
        <Text style={styles.overviewTitle}>ภาพรวมรายเดือน</Text>
      </View>
      <MonthSelector
        selectedYear={year}
        selectedMonth={month}
        onChange={onChangeMonth}
      />
      <View style={styles.overviewBody}>
        <MonthlyPie income={income} expense={expense} />
      </View>
    </View>
  )
}

function TaxProgress({
  used,
  limit,
}: {
  used: number
  limit: number
}) {
  const progress = Math.min(used / limit, 1)
  const pct = Math.round(progress * 100)

  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>ลดหย่อนภาษีปีนี้</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/tax')}
          accessibilityLabel="ดูรายการลดหย่อนทั้งหมด"
          accessibilityRole="button"
        >
          <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.progressLabel}>
            ใช้ไปแล้ว ฿{used.toLocaleString('th-TH')}
          </Text>
          <Text style={[
            styles.progressPct,
            pct >= 100 && { color: Colors.error[500] },
          ]}>
            {pct}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            { width: `${pct}%` as any },
            pct >= 100 && { backgroundColor: Colors.error[500] },
          ]} />
        </View>
        <Text style={styles.progressCap}>
          เพดาน ฿{limit.toLocaleString('th-TH')}
        </Text>
      </View>
    </View>
  )
}

function TransactionItem({
  id, title, subtitle, amount, type, icon, time,
}: {
  id: string
  title: string
  subtitle: string
  amount: number
  type: TransactionType
  icon: string
  time: string
}) {
  return (
    <TouchableOpacity
      style={styles.txItem}
      onPress={() => router.push(`/(app)/transaction/${id}`)}
      accessibilityLabel={`${title} ${formatAmount(amount, type)}`}
      accessibilityRole="button"
    >
      <View style={[styles.txIcon, { backgroundColor: getIconBg(type) }]}>
        <Text style={styles.txIconText}>{icon}</Text>
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txTitle}>{title}</Text>
        <Text style={styles.txSub}>{subtitle}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: getAmountColor(type) }]}>
          {formatAmount(amount, type)}
        </Text>
        <Text style={styles.txTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  )
}

function EmptyTransactions() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyText}>ยังไม่มีรายการ</Text>
      <Text style={styles.emptySub}>กด + เพื่อเพิ่มรายการแรก</Text>
    </View>
  )
}

function RecentTransactions({
  transactions,
}: {
  transactions: {
    id: string
    title: string
    subtitle: string
    amount: number
    type: TransactionType
    icon: string
    time: string
  }[]
}) {
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>รายการล่าสุด</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/history')}
          accessibilityLabel="ดูรายการทั้งหมด"
          accessibilityRole="button"
        >
          <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0
        ? <EmptyTransactions />
        : transactions.map((tx) => (
          <TransactionItem key={tx.id} {...tx} />
        ))
      }
    </View>
  )
}

function BottomNav({ activeTab }: { activeTab: string }) {
  const tabs = [
    { icon: '🏠', label: 'ภาพรวม', route: '/(app)' },
    { icon: '🧮', label: 'จำลองภาษี', route: '/(app)/tax' },
    { icon: '👜', label: 'กระเป๋า', route: '/(app)/wallet' },
    { icon: '⚙️', label: 'ตั้งค่า', route: '/(app)/settings' },
  ]

  return (
    <View style={styles.bnav}>
      {tabs.map((tab, i) => (
        <React.Fragment key={tab.label}>
          {i === 2 && (
            <View style={styles.fabWrap}>
              <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(app)/record')}
                activeOpacity={0.8}
                accessibilityLabel="เพิ่มรายการใหม่"
                accessibilityRole="button"
              >
                <Text style={styles.fabText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.bniItem}
            onPress={() => router.push(tab.route as any)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.route }}
          >
            <Text style={styles.bniIcon}>{tab.icon}</Text>
            <Text style={[
              styles.bniLabel,
              activeTab === tab.route && styles.bniLabelActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  )
}

// ── Main Screen ────────────────────────────────────

export default function DashboardScreen() {
  const user               = useAuthStore(s => s.user)
  const recentTransactions = useTransactionStore(s => s.recentTransactions)
  const monthlyIncome      = useTransactionStore(s => s.monthlyIncome)
  const monthlyExpense     = useTransactionStore(s => s.monthlyExpense)
  const selectedYear       = useTransactionStore(s => s.selectedYear)
  const selectedMonth      = useTransactionStore(s => s.selectedMonth)
  const setSelectedMonth   = useTransactionStore(s => s.setSelectedMonth)
  const fetchRecent        = useTransactionStore(s => s.fetchRecent)
  const fetchMonthlySummary = useTransactionStore(s => s.fetchMonthlySummary)
  const totalBalance       = useWalletStore(s => s.totalBalance)
  const fetchWallets       = useWalletStore(s => s.fetchWallets)
  const deductionUsed      = useTaxStore(s => s.deductionUsed)
  const deductionLimit     = useTaxStore(s => s.deductionLimit)
  const fetchTaxSummary    = useTaxStore(s => s.fetchTaxSummary)

  const daysLeft = getDaysUntilTaxDeadline()

  useEffect(() => {
    if (!user?.id) return
    fetchWallets()
    fetchRecent()
    fetchMonthlySummary()
    fetchTaxSummary()
  }, [user?.id])

  // สร้าง Display Name และ Initials จาก user จริง
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>
  const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ')
  const displayName = fullName
    || meta.username
    || meta.full_name
    || user?.email?.split('@')[0]
    || 'คุณ'

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const lastUpdated = new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header name={displayName} initials={initials} />
        <TaxAlert daysLeft={daysLeft} />
        <SummaryCard
          totalBalance={totalBalance}
          lastUpdated={lastUpdated}
        />
        <MonthlyOverview
          income={monthlyIncome}
          expense={monthlyExpense}
          year={selectedYear}
          month={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />
        <TaxProgress
          used={deductionUsed}
          limit={deductionLimit}
        />
        <RecentTransactions transactions={recentTransactions.map(tx => ({
  id: tx.id,
  title: tx.category || tx.note || 'ไม่มีชื่อ',
  subtitle: tx.note || 'ทั่วไป',         // ✅ เปลี่ยนจาก note เป็น subtitle
  amount: Number(tx.amount) || 0,
  type: tx.type,
  icon: 'wallet',                      // ✅ เติม icon เข้าไปตามที่ UI บังคับ
  time: new Date(tx.date || tx.created_at).toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }),                                  // ✅ เปลี่ยนจาก date เป็น time
}))} />
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="/(app)" />
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy[800],
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  headerGreeting: {
    ...TextStyles.bodySm,
    fontSize: 12,
    color: Colors.text.muted,
  },
  headerName: {
    ...TextStyles.h2,
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TextStyles.h3,
    color: Colors.navy[700],
    fontSize: 16,
  },

  taxAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: 'rgba(245,200,66,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.25)',
  },
  taxAlertIcon: { fontSize: 20 },
  taxAlertTitle: {
    ...TextStyles.bodyMd,
    fontSize: 12,
    color: Colors.orange[500],
    fontWeight: '700',
  },
  taxAlertSub: {
    ...TextStyles.bodySm,
    fontSize: 11,
    color: Colors.text.muted,
  },

  summaryCard: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    padding: 21,
    paddingTop: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(0,200,150,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.2)',
  },
  summaryLabel: {
    ...TextStyles.bodySm,
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  summaryAmount: {
    ...TextStyles.amountHero,
    fontSize: 32,
    letterSpacing: -1,
    marginBottom: 4,
  },
  summarySub: {
    ...TextStyles.bodySm,
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  summaryBoxLabel: {
    ...TextStyles.bodySm,
    fontSize: 10,
    color: Colors.text.muted,
  },
  summaryBoxVal: {
    ...TextStyles.bodyLg,
    fontSize: 15,
    fontWeight: '800',
  },

  overviewCard: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: 12,
  },
  overviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  overviewTitle: {
    ...TextStyles.h3,
    fontSize: 13,
  },
  overviewBody: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  section: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    gap: Spacing[2],
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  sectionTitle: {
    ...TextStyles.h3,
    fontSize: 13,
  },
  seeAll: {
    ...TextStyles.bodySm,
    fontSize: 11,
    color: Colors.emerald[500],
    fontWeight: '700',
  },

  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: 15,
    gap: 6,
  },
  progressLabel: {
    ...TextStyles.bodySm,
    fontSize: 12,
    color: Colors.text.muted,
  },
  progressPct: {
    ...TextStyles.bodyMd,
    fontSize: 12,
    color: Colors.emerald[500],
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border.default,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.emerald[500],
    borderRadius: 4,
  },
  progressCap: {
    ...TextStyles.bodySm,
    fontSize: 11,
    color: Colors.text.muted,
  },

  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconText: { fontSize: 18 },
  txBody: { flex: 1 },
  txTitle: {
    ...TextStyles.bodyLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  txSub: {
    ...TextStyles.bodySm,
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: {
    ...TextStyles.bodyLg,
    fontSize: 13,
    fontWeight: '800',
  },
  txTime: {
    ...TextStyles.bodySm,
    fontSize: 10,
    color: Colors.text.muted,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    gap: Spacing[2],
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    ...TextStyles.h3,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptySub: {
    ...TextStyles.bodySm,
    fontSize: 12,
    color: Colors.text.muted,
  },

  bnav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6,15,30,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingTop: 9,
    paddingBottom: 20,
  },
  bniItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  bniIcon: { fontSize: 20 },
  bniLabel: {
    ...TextStyles.label,
    fontSize: 10,
    color: Colors.text.muted,
    textTransform: 'none',
    letterSpacing: 0,
  },
  bniLabelActive: {
    color: Colors.emerald[500],
    fontWeight: '800',
  },
  fabWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -16,
    marginHorizontal: 8,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.emerald,
  },
  fabText: {
    color: Colors.navy[700],
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
  },
})