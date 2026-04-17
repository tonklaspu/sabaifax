import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

const TABS = [
  { icon: '🏠', label: 'ภาพรวม', route: '/(app)' },
  { icon: '🧮', label: 'จำลองภาษี', route: '/(app)/tax' },
  { icon: '👜', label: 'กระเป๋า', route: '/(app)/wallet' },
  { icon: '⚙️', label: 'ตั้งค่า', route: '/(app)/settings' },
]

type BottomNavProps = {
  activeRoute?: string
}

export function BottomNav({ activeRoute = '/(app)' }: BottomNavProps) {
  return (
    <View className="flex-row items-center bg-navy-800/95 border-t border-white/[0.08] pt-2 pb-5">
      {TABS.map((tab, i) => (
        <React.Fragment key={tab.label}>
          {i === 2 && (
            <View className="items-center justify-end -mt-4 mx-2">
              <TouchableOpacity
                className="w-[52px] h-[52px] rounded-2xl bg-emerald-500 items-center justify-center"
                onPress={() => router.push('/(app)/record' as any)}
                activeOpacity={0.8}
                accessibilityLabel="เพิ่มรายการใหม่"
              >
                <Text className="text-navy-700 text-2xl font-extrabold leading-[26px]">+</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            className="flex-1 items-center gap-1"
            onPress={() => router.push(tab.route as any)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab.route === activeRoute }}
          >
            <Text className="text-xl">{tab.icon}</Text>
            <Text
              className={`text-[10px] font-sarabun ${
                tab.route === activeRoute
                  ? 'text-emerald-500 font-sarabun-extrabold'
                  : 'text-white/55'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  )
}
