import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useWalletStore, Wallet } from '../../../src/store/wallet.store'
import { useTransactionStore } from '../../../src/store/transaction.store'
import { Header, Card, Input, Button } from '../../../src/components'

function WalletPicker({
  wallets,
  selected,
  onSelect,
  label,
  excludeId,
}: {
  wallets: Wallet[]
  selected: string | null
  onSelect: (id: string) => void
  label: string
  excludeId?: string | null
}) {
  const filtered = excludeId ? wallets.filter(w => w.id !== excludeId) : wallets

  return (
    <View className="mb-4">
      <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
        {label}
      </Text>
      <View className="gap-2">
        {filtered.map(w => (
          <TouchableOpacity
            key={w.id}
            className={`flex-row items-center gap-3 p-3.5 rounded-2xl border ${
              selected === w.id
                ? 'bg-emerald-500/[0.13] border-emerald-500'
                : 'bg-white/[0.04] border-white/[0.08]'
            }`}
            onPress={() => onSelect(w.id)}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: w.color + '22' }}
            >
              <Text className="text-xl">{w.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sarabun-bold text-white/95">{w.name}</Text>
              <Text className="text-[11px] font-sarabun text-white/55">
                ฿{w.balance.toLocaleString('th-TH')}
              </Text>
            </View>
            {selected === w.id && (
              <Text className="text-emerald-400 font-sarabun-bold text-lg">✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default function TransferScreen() {
  const params = useLocalSearchParams<{ fromId?: string }>()
  const { wallets } = useWalletStore()
  const { createTransaction } = useTransactionStore()

  const [fromId, setFromId] = useState<string | null>(params.fromId ?? null)
  const [toId, setToId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleTransfer = async () => {
    if (!fromId || !toId) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกกระเป๋าต้นทางและปลายทาง')
      return
    }
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0
    if (numAmount <= 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาระบุจำนวนเงิน')
      return
    }

    setSaving(true)
    try {
      await createTransaction({
        type: 'transfer',
        amount: numAmount,
        wallet_id: fromId,
        to_wallet_id: toId,
        note: note.trim(),
        date: new Date().toISOString(),
      })
      router.back()
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'โอนเงินไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const fromWallet = wallets.find(w => w.id === fromId)

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />
      <Header title="โอนเงิน" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* From wallet */}
        <WalletPicker
          wallets={wallets}
          selected={fromId}
          onSelect={setFromId}
          label="กระเป๋าต้นทาง"
        />

        {/* Arrow */}
        <View className="items-center -my-1 mb-2">
          <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center">
            <Text className="text-emerald-400 text-xl">↓</Text>
          </View>
        </View>

        {/* To wallet */}
        <WalletPicker
          wallets={wallets}
          selected={toId}
          onSelect={setToId}
          label="กระเป๋าปลายทาง"
          excludeId={fromId}
        />

        {/* Amount */}
        <Input
          label="จำนวนเงิน"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          keyboardType="numeric"
        />

        {fromWallet && parseFloat(amount.replace(/,/g, '')) > fromWallet.balance && (
          <Text className="text-error-500 text-xs font-sarabun -mt-2 mb-2">
            ⚠ ยอดเกินยอดคงเหลือในกระเป๋าต้นทาง
          </Text>
        )}

        {/* Note */}
        <Input
          label="หมายเหตุ"
          value={note}
          onChangeText={setNote}
          placeholder="เช่น โอนเข้าออมทรัพย์..."
        />

        <View className="h-10" />
      </ScrollView>

      <View className="p-4 pb-7 border-t border-white/[0.08]">
        <Button
          title="ยืนยันโอนเงิน"
          onPress={handleTransfer}
          loading={saving}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  )
}
