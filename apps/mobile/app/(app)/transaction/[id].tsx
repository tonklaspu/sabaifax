import React, { useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radius, Shadow, TextStyles } from '../../../src/constants'
import { useTransactionStore, TransactionType } from '../../../src/store/transaction.store'
import { useWalletStore } from '../../../src/store/wallet.store'

// ── Helpers ────────────────────────────────────────────

const TYPE_LABEL: Record<TransactionType, string> = {
  expense:  'รายจ่าย',
  income:   'รายรับ',
  transfer: 'โอน',
}
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
const TYPE_BORDER: Record<TransactionType, string> = {
  expense:  Colors.error.border,
  income:   Colors.emerald.border,
  transfer: Colors.info.border,
}

function formatAmount(amount: number, type: TransactionType) {
  const abs = Math.abs(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
  if (type === 'expense') return `-฿${abs}`
  if (type === 'income')  return `+฿${abs}`
  return `฿${abs}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }) + '  ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

// ── Detail Row Component ───────────────────────────────

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  )
}

// ── Main Screen ────────────────────────────────────────

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { allTransactions, recentTransactions, deleteTransaction } = useTransactionStore()
  const { wallets } = useWalletStore()

  const [deleting, setDeleting] = React.useState(false)

  const handleEdit = () => {
    if (!tx) return
    router.push({
      pathname: '/(app)/record/manual',
      params: { editId: tx.id },
    } as any)
  }

  const tx = useMemo(() => {
    return (
      allTransactions.find(t => t.id === id) ??
      recentTransactions.find(t => t.id === id)
    )
  }, [id, allTransactions, recentTransactions])

  const wallet = wallets.find(w => w.id === tx?.wallet_id)

  const handleDelete = () => {
    Alert.alert(
      'ลบรายการนี้',
      'ต้องการลบรายการนี้ใช่ไหม? ไม่สามารถกู้คืนได้',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await deleteTransaction(id!)
              router.back()
            } catch (err: any) {
              Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'ลบไม่สำเร็จ')
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  if (!tx) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>รายละเอียด</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundIcon}>🔍</Text>
          <Text style={styles.notFoundText}>ไม่พบรายการนี้</Text>
        </View>
      </SafeAreaView>
    )
  }

  const color  = TYPE_COLOR[tx.type]
  const dim    = TYPE_DIM[tx.type]
  const border = TYPE_BORDER[tx.type]

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียด</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleEdit} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✏️</Text>
          </TouchableOpacity>
          {deleting
            ? <ActivityIndicator color={Colors.error[500]} style={{ width: 36 }} />
            : (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            )
          }
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Hero */}
        <View style={[styles.heroCard, { borderColor: border, backgroundColor: dim }]}>
          <View style={[styles.typeBadge, { backgroundColor: dim, borderColor: border }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{TYPE_LABEL[tx.type]}</Text>
          </View>
          <Text style={[styles.heroAmount, { color }]}>
            {formatAmount(tx.amount, tx.type)}
          </Text>
          <Text style={styles.heroCategory}>{tx.category}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <DetailRow label="วันที่" value={formatDateTime(tx.date)} />
          {wallet && (
            <DetailRow
              label="กระเป๋า"
              value={`${wallet.icon}  ${wallet.name}`}
            />
          )}
          {!!tx.note && (
            <DetailRow label="หมายเหตุ" value={tx.note} />
          )}
          <DetailRow
            label="จำนวนเงิน"
            value={formatAmount(tx.amount, tx.type)}
            valueColor={color}
          />
        </View>

        {/* Wallet Balance Card */}
        {wallet && (
          <View style={styles.walletCard}>
            <View style={[styles.walletIconBox, { backgroundColor: wallet.color + '22' }]}>
              <Text style={styles.walletIconText}>{wallet.icon}</Text>
            </View>
            <View>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletBalance}>
                ยอดปัจจุบัน ฿{wallet.balance.toLocaleString('th-TH')}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backBtn: { padding: 4, marginRight: 8 },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { flex: 1, ...TextStyles.h2, fontSize: 18 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 20 },

  // Hero
  heroCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing[6],
    marginBottom: Spacing[4],
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.badge,
    borderWidth: 1,
  },
  typeBadgeText: {
    ...TextStyles.caption,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroAmount: {
    ...TextStyles.amountHero,
    fontSize: 44,
  },
  heroCategory: {
    ...TextStyles.bodyLg,
    color: Colors.text.secondary,
    fontSize: 16,
  },

  // Details
  detailCard: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: Spacing[4],
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    gap: 12,
  },
  detailLabel: { ...TextStyles.bodySm, color: Colors.text.muted, flex: 0 },
  detailValue: { ...TextStyles.bodyLg, color: Colors.text.primary, flex: 1, textAlign: 'right', fontSize: 13 },

  // Wallet
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  walletIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconText: { fontSize: 24 },
  walletName: { ...TextStyles.h3, fontSize: 15 },
  walletBalance: { ...TextStyles.monoSm, color: Colors.text.muted, marginTop: 2 },

  // Not Found
  notFoundWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundIcon: { fontSize: 48 },
  notFoundText: { ...TextStyles.bodyMd, color: Colors.text.muted },
})
