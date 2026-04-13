import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius } from '../../../src/constants'
import { useTaxStore } from '../../../src/store/tax.store'
import { TaxDeduction, DEDUCTION_CAPS, formatThb } from '../../../src/utils/tax'

// ── Helpers ───────────────────────────────────────

function fmt(n: number) {
  return Math.round(n).toLocaleString('th-TH')
}

// ── Sub-components ────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

function Row({ label, value, highlight, sub }: {
  label: string
  value: string
  highlight?: 'green' | 'red' | 'gold'
  sub?: string
}) {
  const valueColor =
    highlight === 'green' ? Colors.emerald[500] :
    highlight === 'red'   ? Colors.error[500] :
    highlight === 'gold'  ? Colors.gold[500] :
    Colors.text.primary

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Text style={[styles.rowValue, { color: valueColor }]}>{value}</Text>
    </View>
  )
}

function BracketBar({ income, rate, tax, maxIncome }: {
  income: number; rate: number; tax: number; maxIncome: number
}) {
  const pct = maxIncome > 0 ? Math.min(income / maxIncome, 1) : 0
  return (
    <View style={styles.bracketRow}>
      <Text style={styles.bracketRate}>{rate}%</Text>
      <View style={styles.bracketTrack}>
        <View style={[styles.bracketFill, { width: `${pct * 100}%` as any,
          backgroundColor: rate <= 10 ? Colors.emerald[500] :
                           rate <= 20 ? Colors.gold[500] : Colors.error[500],
        }]} />
      </View>
      <Text style={styles.bracketTax}>฿{fmt(tax)}</Text>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────

export default function TaxScreen() {
  const {
    grossIncome, deductions, result,
    setGrossIncome, updateDeduction, removeDeduction, addDeduction, compute,
  } = useTaxStore()

  const [incomeText, setIncomeText] = useState(grossIncome > 0 ? String(grossIncome) : '')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')

  useEffect(() => { compute() }, [])

  const handleIncomeBlur = () => {
    const val = Number(incomeText.replace(/,/g, ''))
    if (!isNaN(val)) setGrossIncome(val)
  }

  const handleAddDeduction = () => {
    const amount = Number(newAmount.replace(/,/g, ''))
    if (!newLabel.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อและจำนวนเงินให้ถูกต้อง')
      return
    }
    addDeduction({
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      category: 'other',
      amount,
    } as TaxDeduction)
    setNewLabel('')
    setNewAmount('')
    setShowAddForm(false)
  }

  const maxBracketIncome = result
    ? Math.max(...result.brackets.map((b) => b.income), 1)
    : 1

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>จำลองภาษี</Text>
            <Text style={styles.titleSub}>ภาษีเงินได้บุคคลธรรมดา ปี 2568</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(app)/settings/tax-profile')}
          >
            <Text style={styles.profileBtnText}>โปรไฟล์ภาษี ›</Text>
          </TouchableOpacity>
        </View>

        {/* Income Input */}
        <View style={styles.card}>
          <SectionHeader title="รายได้รวมทั้งปี" />
          <View style={styles.incomeRow}>
            <Text style={styles.thb}>฿</Text>
            <TextInput
              style={styles.incomeInput}
              value={incomeText}
              onChangeText={setIncomeText}
              onBlur={handleIncomeBlur}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.text.disabled}
              returnKeyType="done"
              onSubmitEditing={handleIncomeBlur}
            />
          </View>
        </View>

        {/* Summary Card */}
        {result && (
          <View style={styles.card}>
            <SectionHeader title="สรุปผลการคำนวณ" />
            <Row label="รายได้รวม" value={formatThb(result.grossIncome)} />
            <Row label="หักค่าใช้จ่าย (50%)" value={`-${formatThb(result.expenseDeduction)}`} />
            <Row label="หักลดหย่อนรวม" value={`-${formatThb(result.totalDeductions)}`} />
            <View style={styles.divider} />
            <Row label="รายได้สุทธิ" value={formatThb(result.netIncome)} highlight="gold" />
            <View style={styles.divider} />
            <Row
              label="ภาษีที่ต้องชำระ"
              value={formatThb(result.tax)}
              highlight="red"
              sub={`อัตราภาษีที่แท้จริง ${result.effectiveRate.toFixed(2)}%`}
            />
          </View>
        )}

        {/* Tax Brackets */}
        {result && result.brackets.length > 0 && (
          <View style={styles.card}>
            <SectionHeader title="ภาษีแต่ละขั้น" />
            {result.brackets.map((b) => (
              <BracketBar
                key={b.label}
                income={b.income}
                rate={b.rate}
                tax={b.tax}
                maxIncome={maxBracketIncome}
              />
            ))}
          </View>
        )}

        {/* Deductions */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <SectionHeader title="ค่าลดหย่อน" />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddForm((v) => !v)}
            >
              <Text style={styles.addBtnText}>{showAddForm ? 'ยกเลิก' : '+ เพิ่ม'}</Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.addInput}
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="ชื่อรายการลดหย่อน"
                placeholderTextColor={Colors.text.disabled}
              />
              <TextInput
                style={styles.addInput}
                value={newAmount}
                onChangeText={setNewAmount}
                placeholder="จำนวนเงิน"
                placeholderTextColor={Colors.text.disabled}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddDeduction}>
                <Text style={styles.confirmBtnText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          )}

          {deductions.map((d) => (
            <View key={d.id} style={styles.deductionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deductionLabel}>{d.label}</Text>
                {DEDUCTION_CAPS[d.category] > 0 && (
                  <Text style={styles.deductionCap}>
                    เพดาน ฿{fmt(DEDUCTION_CAPS[d.category])}
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.deductionInput}
                value={String(d.amount)}
                onChangeText={(v) => {
                  const n = Number(v.replace(/,/g, ''))
                  if (!isNaN(n)) updateDeduction(d.id, n)
                }}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {d.category === 'other' && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeDeduction(d.id)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          * การคำนวณนี้เป็นเพียงการประมาณการ ควรปรึกษานักบัญชีหรือกรมสรรพากรเพื่อข้อมูลที่ถูกต้อง
        </Text>

      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  scrollContent: { padding: Spacing[4], gap: 12, paddingBottom: Spacing[10] },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  titleSub: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  profileBtn: {
    backgroundColor: 'rgba(0,200,150,0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profileBtnText: { fontSize: 12, fontWeight: '700', color: Colors.emerald[500] },

  card: {
    backgroundColor: Colors.navy[700],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: Spacing[4],
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Income
  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thb: { fontSize: 20, fontWeight: '700', color: Colors.text.secondary },
  incomeInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    paddingVertical: 4,
  },

  // Summary rows
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: { fontSize: 13, color: Colors.text.secondary },
  rowSub: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  rowValue: { fontSize: 13, fontWeight: '700', color: Colors.text.primary },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Brackets
  bracketRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bracketRate: { width: 32, fontSize: 11, fontWeight: '700', color: Colors.text.muted, textAlign: 'right' },
  bracketTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bracketFill: { height: '100%', borderRadius: 4 },
  bracketTax: { width: 72, fontSize: 11, fontWeight: '700', color: Colors.text.primary, textAlign: 'right' },

  // Deductions
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  deductionLabel: { fontSize: 13, color: Colors.text.primary },
  deductionCap: { fontSize: 10, color: Colors.text.muted, marginTop: 1 },
  deductionInput: {
    width: 90,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald[400],
    backgroundColor: 'rgba(0,200,150,0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 12, color: Colors.error[500] },

  // Add form
  addBtn: {
    backgroundColor: 'rgba(0,200,150,0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: Colors.emerald[500] },
  addForm: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: 8,
  },
  addInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  confirmBtn: {
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 13, fontWeight: '800', color: Colors.navy[700] },

  disclaimer: {
    fontSize: 11,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing[2],
    lineHeight: 16,
  },
})
