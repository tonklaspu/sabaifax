import React, { useEffect } from 'react'
import { View, Text, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button } from '../../../src/components'

export default function SuccessScreen() {
  const { amount, type } = useLocalSearchParams<{ amount?: string; type?: string }>()

  // Auto redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.dismissAll()
      router.replace('/(app)')
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const typeLabel = type === 'income' ? 'รายรับ' : type === 'transfer' ? 'โอนเงิน' : 'รายจ่าย'

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />

      <View className="flex-1 items-center justify-center px-8">
        {/* Success Icon */}
        <View className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 items-center justify-center mb-6">
          <Text className="text-emerald-400 text-5xl">✓</Text>
        </View>

        <Text className="text-xl font-sarabun-extrabold text-white/95 mb-2">
          บันทึกสำเร็จ!
        </Text>
        <Text className="text-sm font-sarabun text-white/55 text-center mb-2">
          บันทึก{typeLabel}เรียบร้อยแล้ว
        </Text>

        {amount && (
          <Text className="text-2xl font-mono-semibold text-emerald-400 mt-2">
            ฿{parseFloat(amount).toLocaleString('th-TH')}
          </Text>
        )}
      </View>

      {/* Bottom Actions */}
      <View className="px-4 pb-7 gap-3">
        <Button
          title="เพิ่มรายการใหม่"
          onPress={() => {
            router.dismissAll()
            router.push('/(app)/record' as any)
          }}
        />
        <Button
          title="กลับหน้าหลัก"
          variant="secondary"
          onPress={() => {
            router.dismissAll()
            router.replace('/(app)')
          }}
        />
      </View>
    </SafeAreaView>
  )
}
