import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius } from '../../../src/constants'
import { useTaxProfileStore, TaxProfile } from '../../../src/store/tax-profile.store'
import { useTaxStore } from '../../../src/store/tax.store'

// ── Helpers ───────────────────────────────────────

function fmt(n: number) {
  return n > 0 ? n.toLocaleString('th-TH') : ''
}

// ── Sub-components ────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  )
}

function SwitchRow({
  label, sub, value, onChange,
}: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.fieldRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {!!sub && <Text style={styles.fieldSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.emerald[600] }}
        thumbColor={value ? Colors.emerald[400] : 'rgba(255,255,255,0.4)'}
      />
    </View>
  )
}

function StepperRow({
  label, sub, value, min, max, onChange,
}: {
  label: string; sub?: string
  value: number; min: number; max: number
  onChange: (v: number) => void
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {!!sub && <Text style={styles.fieldSub}>{sub}</Text>}
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity
          style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function AmountRow({
  label, sub, cap, fieldKey, value, onChange,
}: {
  label: string; sub?: string; cap?: string
  fieldKey: keyof TaxProfile; value: number
  onChange: (key: keyof TaxProfile, v: number) => void
}) {
  const [text, setText] = useState(value > 0 ? String(value) : '')

  return (
    <View style={styles.fieldRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {!!sub && <Text style={styles.fieldSub}>{sub}</Text>}
        {!!cap && <Text style={styles.capBadge}>เพดาน {cap}</Text>}
      </View>
      <View style={styles.amountInputWrap}>
        <Text style={styles.thb}>฿</Text>
        <TextInput
          style={styles.amountInput}
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const n = Number(text.replace(/,/g, ''))
            if (!isNaN(n)) onChange(fieldKey, n)
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={Colors.text.disabled}
          returnKeyType="done"
        />
      </View>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────

export default function TaxProfileScreen() {
  const { profile, setField, buildDeductions } = useTaxProfileStore()
  const { grossIncome, setGrossIncome: _setIncome, compute } = useTaxStore()

  const handleApply = () => {
    const deductions = buildDeductions(grossIncome)
    // Replace deductions in tax store
    useTaxStore.setState({ deductions })
    compute()
    router.back()
  }

  const handleAmountChange = (key: keyof TaxProfile, val: number) => {
    setField(key, val as any)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ข้อมูลโปรไฟล์ภาษี</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── ครอบครัว ── */}
        <SectionCard title="ครอบครัว">
          <SwitchRow
            label="มีคู่สมรส"
            sub="คู่สมรสต้องไม่มีรายได้"
            value={profile.hasSpouse}
            onChange={(v) => setField('hasSpouse', v)}
          />
          <StepperRow
            label="จำนวนบุตร"
            sub="30,000 บาท/คน"
            value={profile.children}
            min={0} max={10}
            onChange={(v) => setField('children', v)}
          />
          <StepperRow
            label="บิดามารดาที่เลี้ยงดู"
            sub="30,000 บาท/คน (อายุ ≥ 60 ปี)"
            value={profile.parents}
            min={0} max={4}
            onChange={(v) => setField('parents', v)}
          />
        </SectionCard>

        {/* ── ประกัน ── */}
        <SectionCard title="ประกันภัย">
          <AmountRow
            label="เบี้ยประกันชีวิต"
            cap="100,000"
            fieldKey="lifeInsurance"
            value={profile.lifeInsurance}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="เบี้ยประกันสุขภาพ (ตัวเอง)"
            cap="25,000"
            fieldKey="healthInsurance"
            value={profile.healthInsurance}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="ประกันสุขภาพบิดามารดา"
            cap="15,000"
            fieldKey="parentHealthInsurance"
            value={profile.parentHealthInsurance}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="ประกันสังคม"
            sub="หักอัตโนมัติ 750/เดือน"
            cap="9,000"
            fieldKey="socialSecurity"
            value={profile.socialSecurity}
            onChange={handleAmountChange}
          />
        </SectionCard>

        {/* ── กองทุน ── */}
        <SectionCard title="กองทุน">
          <AmountRow
            label="กองทุนสำรองเลี้ยงชีพ (PVD)"
            cap="500,000"
            fieldKey="providentFund"
            value={profile.providentFund}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="กองทุน RMF"
            sub="ไม่เกิน 30% ของรายได้"
            cap="500,000"
            fieldKey="rmf"
            value={profile.rmf}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="กองทุน SSF"
            sub="ไม่เกิน 30% ของรายได้"
            cap="200,000"
            fieldKey="ssf"
            value={profile.ssf}
            onChange={handleAmountChange}
          />
        </SectionCard>

        {/* ── อื่นๆ ── */}
        <SectionCard title="อื่นๆ">
          <AmountRow
            label="ดอกเบี้ยกู้ซื้อบ้าน"
            cap="100,000"
            fieldKey="mortgageInterest"
            value={profile.mortgageInterest}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="Easy E-Receipt"
            sub="ใบกำกับภาษีอิเล็กทรอนิกส์"
            cap="50,000"
            fieldKey="easyEReceipt"
            value={profile.easyEReceipt}
            onChange={handleAmountChange}
          />
          <AmountRow
            label="เงินบริจาค"
            sub="ไม่เกิน 10% ของรายได้สุทธิ"
            fieldKey="donation"
            value={profile.donation}
            onChange={handleAmountChange}
          />
        </SectionCard>

        {/* Apply Button */}
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>บันทึกและคำนวณภาษี</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          * ข้อมูลที่กรอกจะถูกนำไปคำนวณในหน้าจำลองภาษีทันที
        </Text>

      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: { width: 60 },
  backText: { fontSize: 13, fontWeight: '700', color: Colors.emerald[500] },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary },

  scrollContent: { padding: Spacing[4], gap: 12, paddingBottom: Spacing[10] },

  card: {
    backgroundColor: Colors.navy[700],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: Spacing[4],
    gap: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  fieldLabel: { fontSize: 13, color: Colors.text.primary, fontWeight: '600' },
  fieldSub: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  capBadge: {
    fontSize: 10,
    color: Colors.gold[500],
    marginTop: 2,
    fontWeight: '600',
  },

  // Switch
  // (uses built-in Switch component)

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  stepValue: {
    width: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text.primary,
  },

  // Amount input
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 8,
  },
  thb: { fontSize: 12, color: Colors.text.muted, marginRight: 2 },
  amountInput: {
    width: 90,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald[400],
    textAlign: 'right',
  },

  // Apply
  applyBtn: {
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.xl,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: Colors.navy[700] },

  disclaimer: {
    fontSize: 11,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
})
