import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import { useWalletStore } from '../../../src/store/wallet.store'
import { useTransactionStore, TransactionType } from '../../../src/store/transaction.store'
import { useCategoryStore } from '../../../src/store/category.store'

// ── Config ─────────────────────────────────────────────

const TYPES: { type: TransactionType; label: string; color: string; dimColor: string }[] = [
  { type: 'expense',  label: 'รายจ่าย', color: Colors.error[500],   dimColor: Colors.error.dim },
  { type: 'income',   label: 'รายรับ',  color: Colors.emerald[500], dimColor: Colors.emerald.dim },
  { type: 'transfer', label: 'โอน',     color: Colors.info[500],    dimColor: Colors.info.dim },
]

// ── Screen ─────────────────────────────────────────────

export default function ManualRecordScreen() {
  const { wallets } = useWalletStore()
  const { createTransaction, updateTransaction, recentTransactions, allTransactions } = useTransactionStore()
  const { getByType } = useCategoryStore()
  const params = useLocalSearchParams<{ editId?: string }>()
  const editId = params.editId

  // หา transaction ที่จะแก้ไข
  const editTx = editId
    ? (allTransactions.find(t => t.id === editId) ?? recentTransactions.find(t => t.id === editId))
    : null
  const isEdit = !!editTx

  const [type, setType]           = useState<TransactionType>(editTx?.type ?? 'expense')
  const [amount, setAmount]       = useState(editTx ? String(Number(editTx.amount) || '') : '')
  const [category, setCategory]   = useState(editTx?.category ?? (() => getByType('expense')[0]?.label ?? ''))
  const [note, setNote]           = useState(editTx?.note ?? '')
  const [walletId, setWalletId]   = useState(editTx?.wallet_id ?? editTx?.wallet_id ?? wallets[0]?.id ?? '')
  const [saving, setSaving]       = useState(false)

  const handleTypeChange = (t: TransactionType) => {
    setType(t)
    setCategory(getByType(t)[0]?.label ?? '')
  }

  const activeType = TYPES.find(t => t.type === type)!
  const categories = getByType(type)

  const handleSave = async () => {
    const num = parseFloat(amount.replace(/,/g, ''))
    if (!num || num <= 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่จำนวนเงิน')
      return
    }
    if (!walletId) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกกระเป๋า')
      return
    }

    setSaving(true)
    try {
      if (isEdit && editId) {
        await updateTransaction(editId, {
          wallet_id: walletId || undefined,
          type,
          amount: num,
          category,
          note: note.trim(),
          date: editTx?.date ?? new Date().toISOString(),
        })
      } else {
        await createTransaction({
          wallet_id: walletId,
          type,
          amount: num,
          category,
          note: note.trim(),
          date: new Date().toISOString(),
        })
      }
      router.back()
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'แก้ไขรายการ' : 'บันทึกรายการ'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Type Toggle ── */}
        <View style={styles.typeRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.type}
              style={[
                styles.typeBtn,
                type === t.type && { backgroundColor: t.dimColor, borderColor: t.color },
              ]}
              onPress={() => handleTypeChange(t.type)}
            >
              <Text style={[styles.typeBtnText, type === t.type && { color: t.color }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Amount ── */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>จำนวนเงิน</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountCurrency, { color: activeType.color }]}>฿</Text>
            <TextInput
              style={[styles.amountInput, { color: activeType.color }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.text.disabled}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        </View>

        {/* ── Category ── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>หมวดหมู่</Text>
          <View style={styles.categoryGrid}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.label}
                style={[
                  styles.catChip,
                  category === c.label && {
                    backgroundColor: activeType.dimColor,
                    borderColor: activeType.color,
                  },
                ]}
                onPress={() => setCategory(c.label)}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={[
                  styles.catLabel,
                  category === c.label && { color: activeType.color, fontWeight: '700' },
                ]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Wallet ── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>กระเป๋า</Text>
          {wallets.length === 0 ? (
            <Text style={styles.emptyText}>ยังไม่มีกระเป๋า — กรุณาสร้างกระเป๋าก่อน</Text>
          ) : (
            <View style={styles.walletGrid}>
              {wallets.map(w => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.walletChip,
                    walletId === w.id && { backgroundColor: Colors.navy[400], borderColor: w.color },
                  ]}
                  onPress={() => setWalletId(w.id)}
                >
                  <Text style={styles.walletIcon}>{w.icon}</Text>
                  <View>
                    <Text style={[
                      styles.walletName,
                      walletId === w.id && { color: Colors.text.primary },
                    ]}>
                      {w.name}
                    </Text>
                    <Text style={styles.walletBalance}>
                      ฿{w.balance.toLocaleString('th-TH')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Note ── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>หมายเหตุ (ไม่บังคับ)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="เช่น ข้าวกลางวันกับเพื่อน..."
            placeholderTextColor={Colors.text.placeholder}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Save Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: activeType.color },
            saving && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color={Colors.navy[800]} />
            : <Text style={styles.saveBtnText}>{isEdit ? 'อัปเดต' : 'บันทึก'}</Text>
          }
        </TouchableOpacity>
      </View>
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

  // Type
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing[4],
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  typeBtnText: {
    ...TextStyles.bodyLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.muted,
  },

  // Amount
  amountCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    alignItems: 'center',
  },
  amountLabel: {
    ...TextStyles.label,
    color: Colors.text.muted,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  amountCurrency: {
    ...TextStyles.monoLg,
    fontSize: 28,
    paddingBottom: 4,
  },
  amountInput: {
    ...TextStyles.amountHero,
    fontSize: 48,
    minWidth: 120,
    textAlign: 'center',
  },

  // Fields
  field: { marginBottom: Spacing[4] },
  fieldLabel: {
    ...TextStyles.label,
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  catIcon: { fontSize: 16 },
  catLabel: {
    ...TextStyles.bodySm,
    fontSize: 12,
    color: Colors.text.secondary,
  },

  // Wallet
  walletGrid: { gap: 8 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  walletIcon: { fontSize: 24 },
  walletName: {
    ...TextStyles.bodyLg,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  walletBalance: {
    ...TextStyles.monoSm,
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },

  emptyText: {
    ...TextStyles.bodySm,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },

  // Note
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...TextStyles.bodyLg,
    fontSize: 15,
    color: Colors.text.primary,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Footer
  footer: {
    padding: Spacing[4],
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...TextStyles.bodyLg,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy[800],
  },
})
