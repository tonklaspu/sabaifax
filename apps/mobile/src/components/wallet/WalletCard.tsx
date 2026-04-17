import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

type WalletCardProps = {
  id: string
  name: string
  type: string
  balance: number
  icon: string
  color: string
  isPrimary?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  cash: 'เงินสด',
  bank: 'บัญชีธนาคาร',
  credit: 'บัตรเครดิต',
  savings: 'ออมทรัพย์',
  investment: 'การลงทุน',
  other: 'อื่น ๆ',
}

export function WalletCard({
  id, name, type, balance, icon, color, isPrimary,
}: WalletCardProps) {
  const negative = balance < 0
  return (
    <TouchableOpacity
      className="p-5 mb-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
      onPress={() => router.push(`/(app)/wallet/${id}` as any)}
      accessibilityLabel={`กระเป๋า ${name}`}
      activeOpacity={0.85}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="text-[13px] font-sarabun-bold text-white/90">{name}</Text>
          {isPrimary && (
            <View className="px-2 py-0.5 rounded-md bg-emerald-500/20">
              <Text className="text-[10px] font-sarabun-bold text-emerald-400">หลัก</Text>
            </View>
          )}
        </View>
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: color + '22' }}
        >
          <Text className="text-xl">{icon}</Text>
        </View>
      </View>

      <Text
        className={`text-2xl font-mono-semibold tracking-tight mb-1 ${
          negative ? 'text-error-500' : 'text-white/95'
        }`}
      >
        {negative ? '-' : ''}฿{Math.abs(balance).toLocaleString('th-TH')}
      </Text>
      <Text className="text-[11px] font-sarabun text-white/45">
        {TYPE_LABELS[type] ?? type}
      </Text>
    </TouchableOpacity>
  )
}
