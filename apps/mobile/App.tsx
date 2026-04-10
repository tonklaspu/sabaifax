import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radius, Shadow, TextStyles } from './src/constants'

// ── Types ────────────────────────────────────────
type TransactionType = 'expense' | 'income' | 'transfer'

interface Transaction {
  id: string
  title: string
  subtitle: string
  amount: number
  type: TransactionType
  icon: string
  time: string
}

// ── Mock Data (จาก Figma) ─────────────────────────
const TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'ข้าวกลางวัน', subtitle: 'อาหาร · กระเป๋าหลัก', amount: -85, type: 'expense', icon: '🍚', time: '12:30' },
  { id: '2', title: 'เงินเดือน มี.ค.', subtitle: 'รายรับ · กระเป๋าหลัก', amount: 84200, type: 'income', icon: '💼', time: '08:00' },
  { id: '3', title: 'โอนไปเงินออม', subtitle: 'โอนเงิน', amount: 10000, type: 'transfer', icon: '🔄', time: '09:15' },
]

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

// ── Components ────────────────────────────────────
function StatusBar_() {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>
      <View style={styles.statusRight}>
        <Text style={styles.statusText}>5G</Text>
        <Text style={styles.statusText}>⚡</Text>
      </View>
    </View>
  )
}

function Header() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerGreeting}>สวัสดี 👋</Text>
        <Text style={styles.headerName}>ต้น</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>TP</Text>
      </View>
    </View>
  )
}

function TaxAlert() {
  return (
    <View style={styles.taxAlert}>
      <Text style={styles.taxAlertIcon}>📅</Text>
      <View>
        <Text style={styles.taxAlertTitle}>ยื่นภาษีภายใน 31 มี.ค. นี้</Text>
        <Text style={styles.taxAlertSub}>เหลืออีก 47 วัน</Text>
      </View>
    </View>
  )
}

function SummaryCard() {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>ยอดรวมทุกกระเป๋า</Text>
      <Text style={styles.summaryAmount}>฿284,320</Text>
      <Text style={styles.summarySub}>อัปเดต 09:38</Text>

      <View style={styles.summaryRow}>
        {/* รายรับ */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryBoxLabel}>รายรับเดือนนี้</Text>
          <Text style={[styles.summaryBoxVal, { color: Colors.emerald[500] }]}>
            +฿84,200
          </Text>
        </View>
        {/* รายจ่าย */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryBoxLabel}>รายจ่ายเดือนนี้</Text>
          <Text style={[styles.summaryBoxVal, { color: Colors.error[500] }]}>
            -฿31,480
          </Text>
        </View>
      </View>
    </View>
  )
}

function TaxProgress() {
  const progress = 0.67 // 67%

  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>ลดหย่อนภาษีปีนี้</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.progressLabel}>ใช้ไปแล้ว ฿87,500</Text>
          <Text style={styles.progressPct}>67%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressCap}>เพดาน ฿130,000</Text>
      </View>
    </View>
  )
}

function TransactionItem({ item }: { item: Transaction }) {
  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: getIconBg(item.type) }]}>
        <Text style={styles.txIconText}>{item.icon}</Text>
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txTitle}>{item.title}</Text>
        <Text style={styles.txSub}>{item.subtitle}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: getAmountColor(item.type) }]}>
          {formatAmount(item.amount, item.type)}
        </Text>
        <Text style={styles.txTime}>{item.time}</Text>
      </View>
    </View>
  )
}

function RecentTransactions() {
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>รายการล่าสุด</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
        </TouchableOpacity>
      </View>
      {TRANSACTIONS.map((tx) => (
        <TransactionItem key={tx.id} item={tx} />
      ))}
    </View>
  )
}

function BottomNav() {
  const tabs = [
    { icon: '🏠', label: 'ภาพรวม', active: true },
    { icon: '🧮', label: 'จำลองภาษี', active: false },
    { icon: '👜', label: 'กระเป๋า', active: false },
    { icon: '⚙️', label: 'ตั้งค่า', active: false },
  ]

  return (
    <View style={styles.bnav}>
      {tabs.map((tab, i) => {
        if (i === 2) {
          return (
            <React.Fragment key="fab">
              <View style={styles.bniItem}>
                <Text style={styles.bniIcon}>{tabs[i].icon}</Text>
                <Text style={[styles.bniLabel, tabs[i].active && styles.bniLabelActive]}>
                  {tabs[i].label}
                </Text>
              </View>
              {/* FAB */}
              <View style={styles.fabWrap}>
                <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                  <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
              </View>
              {/* Continue after FAB */}
            </React.Fragment>
          )
        }
        return (
          <TouchableOpacity key={tab.label} style={styles.bniItem}>
            <Text style={styles.bniIcon}>{tab.icon}</Text>
            <Text style={[styles.bniLabel, tab.active && styles.bniLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// ── Main Screen ────────────────────────────────────
export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
      <StatusBar_ />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <TaxAlert />
        <SummaryCard />
        <TaxProgress />
        <RecentTransactions />
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav />
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

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  statusTime: {
    ...TextStyles.monoSm,
    fontSize: 12,
    fontWeight: '700',
  },
  statusRight: { flexDirection: 'row', gap: 5 },
  statusText: { ...TextStyles.bodySm, fontSize: 11 },

  // Header
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

  // Tax Alert
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

  // Summary Card
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

  // Section
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

  // Tax Progress
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

  // Transaction Item
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

  // Bottom Nav
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