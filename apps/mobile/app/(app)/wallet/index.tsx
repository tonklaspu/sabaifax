import React, { useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useWalletStore } from '../../../src/store/wallet.store'
import { Header, WalletCard, BottomNav } from '../../../src/components'

export default function WalletListScreen() {
  const { wallets, totalBalance, loading, fetchWallets } = useWalletStore()

  useEffect(() => {
    fetchWallets()
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />

      <Header
        title="กระเป๋าเงิน"
        showBack={true}
        rightElement={
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-emerald-500 items-center justify-center"
            onPress={() => router.push('/(app)/wallet/new')}
            accessibilityLabel="เพิ่มกระเป๋าใหม่"
          >
            <Text className="text-navy-800 text-[22px] font-extrabold leading-6">+</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Balance Hero */}
        <View className="mx-4 mb-4 p-6 rounded-3xl bg-emerald-500/[0.06] border border-emerald-500/20">
          <Text className="text-[11px] font-sarabun text-white/55 mb-1">ยอดรวมทั้งหมด</Text>
          <Text className="text-[32px] font-mono-semibold tracking-tighter text-white/95">
            ฿{totalBalance.toLocaleString('th-TH')}
          </Text>
        </View>

        {/* Wallet List */}
        {loading ? (
          <ActivityIndicator color="#00C896" className="mt-10" />
        ) : wallets.length === 0 ? (
          <View className="items-center pt-16 gap-2">
            <Text className="text-5xl">👜</Text>
            <Text className="text-[15px] font-sarabun-bold text-white/70">ยังไม่มีกระเป๋าเงิน</Text>
            <Text className="text-xs font-sarabun text-white/55">กด + เพื่อเพิ่มกระเป๋าแรก</Text>
            <TouchableOpacity
              className="mt-3 px-6 py-3 rounded-[14px] bg-emerald-500"
              onPress={() => router.push('/(app)/wallet/new')}
            >
              <Text className="text-navy-800 font-sarabun-bold text-sm">+ เพิ่มกระเป๋า</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4">
            {wallets.map((w, idx) => (
              <WalletCard
                key={w.id}
                id={w.id}
                name={w.name}
                type={w.type}
                balance={w.balance}
                icon={w.icon}
                color={w.color}
                isPrimary={idx === 0}
              />
            ))}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      <BottomNav activeRoute="/(app)/wallet" />
    </SafeAreaView>
  )
}
