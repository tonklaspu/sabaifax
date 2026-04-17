import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import { useBudgetStore } from '../../../src/store/budget.store'
import { useTransactionStore } from '../../../src/store/transaction.store'

const PRESETS = [5000, 10000, 15000, 20000, 30000, 50000]

export default function BudgetSettingsScreen() {
  const { monthlyLimit, loading, fetchBudget, updateBudget } = useBudgetStore()
  const { monthlyExpense } = useTransactionStore()

  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBudget()
  }, [])

  useEffect(() => {
    if (monthlyLimit > 0) {
      setAmount(String(monthlyLimit))
    }
  }, [monthlyLimit])

  const spent = monthlyExpense
  const limit = parseFloat(amount.replace(/,/g, '')) || 0
  const progress = limit > 0 ? Math.min(spent / limit, 1) : 0
  const pct = Math.round(progress * 100)
  const remaining = Math.max(limit - spent, 0)
  const isOver = spent > limit && limit > 0

  const handleSave = async () => {
    const num = parseFloat(amount.replace(/,/g, ''))
    if (!num || num <= 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่จำนวนเงิน')
      return
    }
    setSaving(true)
    try {
      await updateBudget(num)
      Alert.alert('สำเร็จ', 'บันทึก Budget เรียบร้อย', [
        { text: 'ตกลง', onPress: () => router.back() },
      ])
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
        <Text style={styles.headerTitle}>ตั้งค่า Budget</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.emerald[500]} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Card */}
          {limit > 0 && (
            <View style={[styles.progressCard, isOver && styles.progressCardOver]}>
              <Text style={styles.progressTitle}>
                {isOver ? '⚠️ ใช้เกิน Budget!' : '📊 สถานะเดือนนี้'}
              </Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>ใช้ไป</Text>
                <Text style={[styles.progressValue, isOver && { color: Colors.error[500] }]}>
                  ฿{spent.toLocaleString('th-TH')}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pct}%` as any },
                    isOver && { backgroundColor: Colors.error[500] },
                  ]}
                />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>เหลือ</Text>
                <Text style={[styles.progressValue, { color: Colors.emerald[400] }]}>
                  ฿{remaining.toLocaleString('th-TH')}
                </Text>
              </View>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>วงเงินรายเดือน (บาท)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountCurrency}>฿</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={Colors.text.disabled}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Presets */}
          <Text style={styles.presetLabel}>เลือกจำนวน</Text>
          <View style={styles.presetGrid}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetChip,
                  parseFloat(amount) === p && styles.presetChipActive,
                ]}
                onPress={() => setAmount(String(p))}
              >
                <Text style={[
                  styles.presetText,
                  parseFloat(amount) === p && styles.presetTextActive,
                ]}>
                  ฿{p.toLocaleString('th-TH')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              ตั้ง Budget ช่วยควบคุมรายจ่ายรายเดือน{'\n'}
              แอปจะแจ้งเตือนเมื่อใกล้ถึงวงเงินที่ตั้งไว้
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color={Colors.navy[800]} />
            : <Text style={styles.saveBtnText}>บันทึก</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3] },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backBtn: { padding: 4, marginRight: 8 },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { flex: 1, ...TextStyles.h2, fontSize: 18 },

  // Progress
  progressCard: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.emerald.border,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    gap: 10,
  },
  progressCardOver: {
    borderColor: Colors.error.border,
    backgroundColor: Colors.error.dim,
  },
  progressTitle: {
    ...TextStyles.h3,
    fontSize: 15,
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...TextStyles.bodySm,
    color: Colors.text.muted,
  },
  progressValue: {
    ...TextStyles.monoMd,
    fontSize: 14,
    color: Colors.text.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.emerald[500],
  },

  // Input
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    alignItems: 'center',
  },
  inputLabel: {
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
    color: Colors.emerald[400],
    paddingBottom: 4,
  },
  amountInput: {
    ...TextStyles.amountHero,
    fontSize: 48,
    color: Colors.emerald[400],
    minWidth: 120,
    textAlign: 'center',
  },

  // Presets
  presetLabel: {
    ...TextStyles.label,
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing[4],
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  presetChipActive: {
    backgroundColor: Colors.emerald.dim,
    borderColor: Colors.emerald.border,
  },
  presetText: {
    ...TextStyles.monoSm,
    color: Colors.text.secondary,
  },
  presetTextActive: {
    color: Colors.emerald[400],
    fontWeight: '700',
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[4],
  },
  tipIcon: { fontSize: 20 },
  tipText: {
    ...TextStyles.bodySm,
    color: Colors.text.muted,
    flex: 1,
    lineHeight: 20,
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
    backgroundColor: Colors.emerald[500],
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...TextStyles.bodyLg,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.navy[800],
  },
})
