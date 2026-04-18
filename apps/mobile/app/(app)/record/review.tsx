import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors } from '../../../src/constants'
import { useWalletStore } from '../../../src/store/wallet.store'
import { useTransactionStore, TransactionType } from '../../../src/store/transaction.store'
import { useScanStore } from '../../../src/store/scan.store'
import { useCategoryStore } from '../../../src/store/category.store'
import { Header, Button } from '../../../src/components'
import { api } from '../../../src/services/api.client'
import { suggestCategorySlug, resolveCategoryBySlug } from '../../../src/utils/category-mapper'
import { markAssetProcessed } from '../../../src/services/processed-assets.service'
import { enqueue as enqueueOffline } from '../../../src/services/offline-queue.service'

const TYPES: { type: TransactionType; label: string; color: string; dimBg: string; borderCls: string }[] = [
  { type: 'expense',  label: 'รายจ่าย', color: 'text-error-500',   dimBg: 'bg-error-500/[0.13]',   borderCls: 'border-error-500' },
  { type: 'income',   label: 'รายรับ',  color: 'text-emerald-500', dimBg: 'bg-emerald-500/[0.13]', borderCls: 'border-emerald-500' },
  { type: 'transfer', label: 'โอน',     color: 'text-info-500',    dimBg: 'bg-info-500/[0.13]',    borderCls: 'border-info-500' },
]

export default function ReviewScreen() {
  const { wallets } = useWalletStore()
  const { fetchRecent } = useTransactionStore()
  const { pendingImageUri, pendingAssetId, ocrResult, clear } = useScanStore()
  const { getByType, categories: allCategories } = useCategoryStore()

  const defaultType: TransactionType = ocrResult?.isSlip ? 'transfer' : 'expense'

  // ── Epic 2: Auto-categorization ──
  const suggestedSlug = useMemo(
    () => suggestCategorySlug(
      [ocrResult?.merchantName, ocrResult?.rawText].filter(Boolean).join(' ')
    ),
    [ocrResult?.merchantName, ocrResult?.rawText],
  )
  const initialCategory = useMemo(() => {
    const byType = getByType(defaultType)
    const matched = resolveCategoryBySlug(suggestedSlug, byType)
    return matched?.label ?? byType[0]?.label ?? ''
  }, [defaultType, suggestedSlug, allCategories])

  const [type, setType] = useState<TransactionType>(defaultType)
  const [amount, setAmount] = useState(() => ocrResult?.amount ? String(ocrResult.amount) : '')
  const [category, setCategory] = useState(initialCategory)
  const [note, setNote] = useState(() => {
    if (ocrResult?.merchantName) return ocrResult.merchantName
    if (ocrResult?.bank && ocrResult.bank !== 'UNKNOWN') return `สลิป ${ocrResult.bank}`
    return ''
  })
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const ocrConfidence: 'high' | 'low' | 'none' =
    ocrResult?.amount ? 'high' : ocrResult?.rawText ? 'low' : 'none'

  useEffect(() => {
    if (!pendingImageUri) router.replace('/(app)/record/scanner')
  }, [pendingImageUri])

  const handleTypeChange = (t: TransactionType) => {
    setType(t)
    setCategory(getByType(t)[0]?.label ?? '')
  }

  const activeType = TYPES.find(t => t.type === type)!
  const categories = getByType(type)

  // ── Epic 2: resolve categoryId จาก label/slug ปัจจุบัน เพื่อส่งให้ DB ──
  const resolvedCategoryId = useMemo(() => {
    const match = getByType(type).find(c => c.label === category)
    // Default categories (exp_/inc_/tra_) ไม่ใช่ UUID — ถ้ายังไม่ sync ลง DB ให้ส่ง null
    if (!match || /^(exp|inc|tra)_/.test(match.id)) return null
    return match.id
  }, [category, type, allCategories])

  const submitTransaction = async (force: boolean): Promise<void> => {
    const num = parseFloat(amount.replace(/,/g, ''))

    const body: any = {
      walletId,
      categoryId: resolvedCategoryId,
      type,
      amount: num,
      note: note.trim(),
      date: new Date().toISOString(),
      // ── Epic 1 duplicate protection payload ──
      slipRef: ocrResult?.slipRef ?? undefined,
      bank:    ocrResult?.bank && ocrResult.bank !== 'UNKNOWN' ? ocrResult.bank : undefined,
      force,
    }

    // ── Epic 4: postRaw, catch network error → enqueue offline ──
    let res: Awaited<ReturnType<typeof api.postRaw>>
    try {
      res = await api.postRaw('/transactions', body)
    } catch (netErr: any) {
      await enqueueOffline(body, { assetId: pendingAssetId ?? undefined })
      if (pendingAssetId) await markAssetProcessed(pendingAssetId).catch(() => {})
      clear()
      Alert.alert(
        'บันทึกออฟไลน์',
        'ไม่มีอินเทอร์เน็ต — บันทึกไว้ในคิวและจะส่งให้เซิร์ฟเวอร์อัตโนมัติเมื่อเชื่อมต่อ',
      )
      router.replace({
        pathname: '/(app)/record/success',
        params: { amount: String(num), type, offline: '1' },
      })
      return
    }

    // ── Layer 2: slipRef ซ้ำ (hard reject) ──
    if (res.status === 409 && res.data?.error === 'DUPLICATE_SLIP_REF') {
      Alert.alert(
        'สลิปซ้ำ',
        'สลิปนี้เคยถูกบันทึกแล้ว (เลขอ้างอิงซ้ำ) — ไม่สามารถบันทึกซ้ำได้',
      )
      return
    }

    // ── Layer 3: hash ซ้ำใน ±24ชม. (soft warning) ──
    if (res.status === 409 && res.data?.error === 'POSSIBLE_DUPLICATE' && !force) {
      Alert.alert(
        'รายการอาจซ้ำ',
        'พบรายการที่คล้ายกันในช่วง 24 ชม. — ต้องการบันทึกซ้ำหรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'บันทึกต่อ', style: 'destructive', onPress: () => submitTransaction(true) },
        ],
      )
      return
    }

    if (!res.ok) {
      throw new Error(res.data?.message ?? `บันทึกไม่สำเร็จ (${res.status})`)
    }

    // ── Success ──
    if (pendingAssetId) {
      await markAssetProcessed(pendingAssetId).catch(() => {})
    }
    fetchRecent().catch(() => {})
    clear()
    router.replace({
      pathname: '/(app)/record/success',
      params: { amount: String(num), type },
    })
  }

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
      await submitTransaction(false)
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!pendingImageUri) return null

  // Dynamic color based on active type for inline styles
  const activeColor = type === 'expense' ? Colors.error[500] : type === 'income' ? Colors.emerald[500] : Colors.info[500]
  const activeDim = type === 'expense' ? Colors.error.dim : type === 'income' ? Colors.emerald.dim : Colors.info.dim

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />
      <Header title="ตรวจสอบรายการ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scanned Image */}
        <View className="rounded-2xl overflow-hidden bg-navy-700 border border-white/[0.08] mb-4">
          {!imgError ? (
            <Image
              source={{ uri: pendingImageUri }}
              className="w-full h-[220px]"
              style={{ backgroundColor: '#0B1F3A' }}
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <View className="h-[220px] items-center justify-center gap-2">
              <Text className="text-[40px]">🖼️</Text>
              <Text className="text-xs font-sarabun text-white/55">ไม่สามารถแสดงรูปได้</Text>
            </View>
          )}

          {/* OCR Badge */}
          <View
            className={`py-2 px-3 border-t ${
              ocrConfidence === 'high'
                ? 'bg-emerald-500/[0.13] border-emerald-500/30'
                : ocrConfidence === 'low'
                ? 'bg-gold-500/[0.13] border-gold-500/30'
                : 'bg-navy-700 border-white/[0.08]'
            }`}
          >
            <Text
              className={`text-[11px] font-sarabun-medium text-center ${
                ocrConfidence === 'high'
                  ? 'text-emerald-400'
                  : ocrConfidence === 'low'
                  ? 'text-gold-400'
                  : 'text-white/55'
              }`}
            >
              {ocrConfidence === 'high' && '✅  OCR อ่านยอดเงินได้แล้ว — ตรวจสอบก่อนบันทึก'}
              {ocrConfidence === 'low' && '⚠️  OCR อ่านข้อความได้บางส่วน — กรุณากรอกยอดเงิน'}
              {ocrConfidence === 'none' && '✏️  OCR อ่านไม่ได้ — กรอกข้อมูลด้วยตัวเอง'}
            </Text>
          </View>
        </View>

        {/* Type Toggle */}
        <View className="flex-row gap-2 mb-4">
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.type}
              className={`flex-1 py-3 rounded-[10px] border items-center ${
                type === t.type
                  ? `${t.dimBg} ${t.borderCls}`
                  : 'bg-white/[0.04] border-white/[0.08]'
              }`}
              onPress={() => handleTypeChange(t.type)}
            >
              <Text
                className={`text-sm font-sarabun-bold ${
                  type === t.type ? t.color : 'text-white/55'
                }`}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View className="bg-white/[0.04] rounded-[20px] border border-white/[0.08] p-5 mb-4 items-center">
          <Text className="text-[10px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-3">
            จำนวนเงิน
          </Text>
          <View className="flex-row items-end gap-1">
            <Text className="text-[28px] font-mono-semibold pb-1" style={{ color: activeColor }}>
              ฿
            </Text>
            <TextInput
              className="text-[48px] font-mono-semibold min-w-[120px] text-center"
              style={{ color: activeColor }}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.28)"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            หมวดหมู่
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map(c => (
              <TouchableOpacity
                key={c.label}
                className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl border ${
                  category === c.label
                    ? `border-current`
                    : 'bg-white/[0.05] border-white/[0.08]'
                }`}
                style={category === c.label ? {
                  backgroundColor: activeDim,
                  borderColor: activeColor,
                } : undefined}
                onPress={() => setCategory(c.label)}
              >
                <Text className="text-base">{c.icon}</Text>
                <Text
                  className="text-xs font-sarabun"
                  style={{ color: category === c.label ? activeColor : 'rgba(255,255,255,0.7)' }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wallet */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            กระเป๋า
          </Text>
          {wallets.length === 0 ? (
            <Text className="text-xs font-sarabun text-white/55 italic">ยังไม่มีกระเป๋า</Text>
          ) : (
            <View className="gap-2">
              {wallets.map(w => (
                <TouchableOpacity
                  key={w.id}
                  className={`flex-row items-center gap-3 p-3.5 rounded-xl border ${
                    walletId === w.id
                      ? 'bg-navy-400 border-current'
                      : 'bg-white/[0.04] border-white/[0.08]'
                  }`}
                  style={walletId === w.id ? { borderColor: w.color } : undefined}
                  onPress={() => setWalletId(w.id)}
                >
                  <Text className="text-2xl">{w.icon}</Text>
                  <View>
                    <Text className={`text-sm font-sarabun-medium ${walletId === w.id ? 'text-white/95' : 'text-white/70'}`}>
                      {w.name}
                    </Text>
                    <Text className="text-[11px] font-mono text-white/45 mt-0.5">
                      ฿{w.balance.toLocaleString('th-TH')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Note */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            หมายเหตุ (ไม่บังคับ)
          </Text>
          <TextInput
            className="bg-white/[0.06] border border-white/[0.08] rounded-[14px] px-4 py-3.5 text-[15px] font-sarabun-medium text-white/95 min-h-[80px]"
            style={{ textAlignVertical: 'top' }}
            value={note}
            onChangeText={setNote}
            placeholder="เช่น ชื่อร้าน หรือรายละเอียดเพิ่มเติม..."
            placeholderTextColor="rgba(255,255,255,0.28)"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Save */}
      <View className="p-4 pb-7 border-t border-white/[0.08]">
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${saving ? 'opacity-60' : ''}`}
          style={{ backgroundColor: activeColor }}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#060F1E" />
          ) : (
            <Text className="text-[15px] font-sarabun-extrabold text-navy-800">บันทึกรายการ</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
