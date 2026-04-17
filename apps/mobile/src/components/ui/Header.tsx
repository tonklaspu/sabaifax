import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

type HeaderProps = {
  title: string
  showBack?: boolean
  rightElement?: React.ReactNode
}

export function Header({ title, showBack = true, rightElement }: HeaderProps) {
  return (
    <View className="flex-row items-center px-4 py-4">
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 mr-2"
          accessibilityLabel="ย้อนกลับ"
          accessibilityRole="button"
        >
          <Text className="text-[22px] text-white/95">←</Text>
        </TouchableOpacity>
      ) : (
        <View className="w-8" />
      )}
      <Text className="flex-1 text-lg font-sarabun-bold text-white/95" numberOfLines={1}>
        {title}
      </Text>
      {rightElement ?? <View className="w-9" />}
    </View>
  )
}
