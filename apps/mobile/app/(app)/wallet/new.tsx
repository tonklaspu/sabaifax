import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useWalletStore, Wallet } from '../../../src/store/wallet.store'
import { Header, Card, Input, Button } from '../../../src/components'

const WALLET_TYPES: { type: Wallet['type']; label: string; icon: string }[] = [
  { type: 'cash',       label: 'เงินสด',       icon: '💵' },
  { type: 'bank',       label: 'บัญชีธนาคาร',   icon: '🏦' },
  { type: 'savings',    label: 'ออมทรัพย์',     icon: '🐷' },
  { type: 'credit',     label: 'บัตรเครดิต',    icon: '💳' },
  { type: 'investment', label: 'การลงทุน',      icon: '📈' },
  { type: 'other',      label: 'อื่น ๆ',         icon: '👛' },
]

const COLORS = [
  '#00C896', '#4A9EDB', '#A78BFA', '#FB923C',
  '#F5C842', '#FF5C7A', '#6EE7B7', '#93C5FD',
]

const ICONS = ['💵', '🏦', '🐷', '💳', '📈', '👛', '💰', '🏧', '💎', '🪙']

export default function NewWalletScreen() {
  const { createWallet } = useWalletStore()

  const [name, setName] = useState('')
  const [type, setType] = useState<Wallet['type']>('cash')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState('💵')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่ชื่อกระเป๋า')
      return
    }
    const numBalance = parseFloat(balance.replace(/,/g, '')) || 0
    setSaving(true)
    try {
      await createWallet({ name: name.trim(), type, balance: numBalance, color, icon })
      router.back()
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'ไม่สามารถสร้างกระเป๋าได้')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />
      <Header title="เพิ่มกระเป๋าใหม่" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Live Preview */}
        <Card
          variant="default"
          className="flex-row items-center gap-4 p-5 rounded-[20px] mb-4"
          style={{ borderColor: color + '66' } as any}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: color + '22' }}
          >
            <Text className="text-[28px]">{icon}</Text>
          </View>
          <View>
            <Text className="text-base font-sarabun-bold text-white/95">
              {name || 'ชื่อกระเป๋า'}
            </Text>
            <Text className="text-[13px] font-mono-medium text-emerald-400 mt-0.5">
              ฿{(parseFloat(balance.replace(/,/g, '')) || 0).toLocaleString('th-TH')}
            </Text>
          </View>
        </Card>

        {/* Name */}
        <Input
          label="ชื่อกระเป๋า *"
          value={name}
          onChangeText={setName}
          placeholder="เช่น กระเป๋าหลัก, SCB, กองทุน..."
          maxLength={40}
        />

        {/* Balance */}
        <Input
          label="ยอดเริ่มต้น"
          value={balance}
          onChangeText={setBalance}
          placeholder="0"
          keyboardType="numeric"
        />

        {/* Type */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            ประเภท
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WALLET_TYPES.map(t => (
              <TouchableOpacity
                key={t.type}
                className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl border ${
                  type === t.type
                    ? 'bg-emerald-500/[0.13] border-emerald-500'
                    : 'bg-white/[0.05] border-white/[0.08]'
                }`}
                onPress={() => { setType(t.type); setIcon(t.icon) }}
              >
                <Text className="text-base">{t.icon}</Text>
                <Text
                  className={`text-xs font-sarabun ${
                    type === t.type
                      ? 'text-emerald-400 font-sarabun-bold'
                      : 'text-white/70'
                  }`}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            สี
          </Text>
          <View className="flex-row gap-2.5 flex-wrap">
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                className={`w-9 h-9 rounded-full ${color === c ? 'border-2 border-white scale-110' : ''}`}
                style={{ backgroundColor: c }}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Icon */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            ไอคอน
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {ICONS.map(ic => (
              <TouchableOpacity
                key={ic}
                className={`w-12 h-12 rounded-[14px] items-center justify-center border ${
                  icon === ic
                    ? 'bg-emerald-500/[0.13] border-emerald-500'
                    : 'bg-white/[0.05] border-white/[0.08]'
                }`}
                onPress={() => setIcon(ic)}
              >
                <Text className="text-2xl">{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Save */}
      <View className="p-4 pb-7 border-t border-white/[0.08]">
        <Button
          title="บันทึกกระเป๋า"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  )
}
