import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import {
  getQueue, remove, clearQueue, QueuedTransaction, QueueStatus,
} from '../../../src/services/offline-queue.service'
import { syncNow } from '../../../src/services/sync-worker.service'

const STATUS_META: Record<QueueStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอส่ง',   color: Colors.gold[400],    bg: 'rgba(250,204,21,0.12)' },
  syncing: { label: 'กำลังส่ง', color: Colors.info[400],    bg: 'rgba(96,165,250,0.12)' },
  failed:  { label: 'ล้มเหลว', color: Colors.error[400],   bg: 'rgba(248,113,113,0.12)' },
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatBaht(n: number): string {
  return `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function QueueScreen() {
  const [items, setItems]       = useState<QueuedTransaction[]>([])
  const [loading, setLoading]   = useState(true)
  const [syncing, setSyncing]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const list = await getQueue()
    list.sort((a, b) => b.createdAt - a.createdAt)
    setItems(list)
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      await load()
      setLoading(false)
    })()
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleSyncNow = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await syncNow()
      await load()
      Alert.alert(
        'Sync เสร็จแล้ว',
        `สำเร็จ ${res.synced} / ล้มเหลว ${res.failed} / ทั้งหมด ${res.total}`,
      )
    } catch (err: any) {
      Alert.alert('Sync ล้มเหลว', err?.message ?? 'unknown error')
    } finally {
      setSyncing(false)
    }
  }

  const handleRemove = (entry: QueuedTransaction) => {
    Alert.alert(
      'ลบรายการนี้?',
      `${entry.payload.type} ${formatBaht(entry.payload.amount)}\nclientTxId: ${entry.clientTxId.slice(0, 8)}…`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            await remove(entry.clientTxId)
            await load()
          },
        },
      ],
    )
  }

  const handleClearAll = () => {
    if (items.length === 0) return
    Alert.alert(
      'ล้าง queue ทั้งหมด?',
      `จะลบรายการในคิว ${items.length} รายการ — การทำงานนี้ไม่สามารถย้อนกลับได้`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ล้างทั้งหมด',
          style: 'destructive',
          onPress: async () => {
            await clearQueue()
            await load()
          },
        },
      ],
    )
  }

  const pendingCount = items.filter(e => e.status === 'pending').length
  const failedCount  = items.filter(e => e.status === 'failed').length

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Queue</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.emerald[500]}
          />
        }
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <SummaryCell label="ทั้งหมด" value={items.length} />
            <SummaryCell label="รอส่ง"   value={pendingCount} color={Colors.gold[400]} />
            <SummaryCell label="ล้มเหลว" value={failedCount}  color={Colors.error[400]} />
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, syncing && { opacity: 0.6 }]}
              onPress={handleSyncNow}
              disabled={syncing}
              activeOpacity={0.8}
            >
              {syncing
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={styles.btnPrimaryText}>↻ Sync ตอนนี้</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnDanger, items.length === 0 && { opacity: 0.4 }]}
              onPress={handleClearAll}
              disabled={items.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.btnDangerText}>ล้างทั้งหมด</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.emerald[500]} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>ไม่มีรายการในคิว</Text>
            <Text style={styles.emptySub}>ทุกอย่างถูก sync ขึ้น server แล้ว</Text>
          </View>
        ) : (
          items.map(entry => (
            <QueueItem key={entry.clientTxId} entry={entry} onRemove={() => handleRemove(entry)} />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Sub components ─────────────────────────────────────

function SummaryCell({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  )
}

function QueueItem({ entry, onRemove }: { entry: QueuedTransaction; onRemove: () => void }) {
  const meta = STATUS_META[entry.status]
  const typeIcon = entry.payload.type === 'income' ? '⬇️' : entry.payload.type === 'transfer' ? '🔄' : '⬆️'

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemType}>{typeIcon} {entry.payload.type}</Text>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <Text style={styles.itemAmount}>{formatBaht(entry.payload.amount)}</Text>

      {!!entry.payload.note && (
        <Text style={styles.itemNote} numberOfLines={2}>📝 {entry.payload.note}</Text>
      )}

      <View style={styles.metaGrid}>
        <MetaLine label="ID"         value={entry.clientTxId.slice(0, 8) + '…'} />
        <MetaLine label="สร้างเมื่อ" value={formatTime(entry.createdAt)} />
        <MetaLine label="ลองแล้ว"    value={`${entry.attempts} ครั้ง`} />
        {!!entry.payload.slipRef && <MetaLine label="Slip Ref" value={entry.payload.slipRef} />}
        {!!entry.payload.bank    && <MetaLine label="ธนาคาร"  value={entry.payload.bank} />}
      </View>

      {!!entry.lastError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {entry.lastError}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
        <Text style={styles.removeBtnText}>ลบออกจากคิว</Text>
      </TouchableOpacity>
    </View>
  )
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaLine}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText: { ...TextStyles.h1, fontSize: 28, color: Colors.text.primary, lineHeight: 30 },
  headerTitle: { ...TextStyles.h1, fontSize: 18 },

  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    gap: Spacing[3],
  },

  summaryCard: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryCell: { alignItems: 'center' },
  summaryValue: { ...TextStyles.h1, fontSize: 24, color: Colors.text.primary },
  summaryLabel: { ...TextStyles.bodySm, fontSize: 11, color: Colors.text.muted, marginTop: 2 },

  btnRow: { flexDirection: 'row', gap: Spacing[2] },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: Colors.emerald[500] },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#000' },
  btnDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error.border ?? Colors.error[500],
  },
  btnDangerText: { fontSize: 14, fontWeight: '700', color: Colors.error[400] },

  centerBox: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { ...TextStyles.h3, fontSize: 15 },
  emptySub: { ...TextStyles.bodySm, color: Colors.text.muted },

  item: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemType: { ...TextStyles.bodyLg, fontSize: 13, color: Colors.text.muted },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemAmount: { ...TextStyles.h2, fontSize: 20, color: Colors.text.primary },
  itemNote: { ...TextStyles.bodySm, fontSize: 12, color: Colors.text.secondary },

  metaGrid: { gap: 4, paddingTop: 6 },
  metaLine: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { ...TextStyles.bodySm, fontSize: 11, color: Colors.text.muted },
  metaValue: { ...TextStyles.bodySm, fontSize: 11, color: Colors.text.secondary },

  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: Radius.md,
    padding: 8,
    marginTop: 4,
  },
  errorText: { fontSize: 11, color: Colors.error[400] },

  removeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.error[400] },
})
