import { View, Text } from 'react-native'

type BalanceCardProps = {
  total: number
  income?: number
  expense?: number
}

export function BalanceCard({ total, income = 0, expense = 0 }: BalanceCardProps) {
  return (
    <View className="mx-4 mb-4 p-6 rounded-3xl bg-emerald-500/[0.07] border border-emerald-500/30 items-center">
      <Text className="text-xs font-sarabun text-white/55 mb-1">กระเป๋าเงิน</Text>
      <Text className="text-4xl font-mono-semibold text-white/95 tracking-tighter">
        ฿{total.toLocaleString('th-TH')}
      </Text>

      {(income > 0 || expense > 0) && (
        <View className="flex-row gap-6 mt-4">
          <View className="items-center">
            <Text className="text-[10px] font-sarabun text-white/55 mb-0.5">รายรับ</Text>
            <Text className="text-sm font-mono-semibold text-emerald-400">
              ฿{income.toLocaleString('th-TH')}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-[10px] font-sarabun text-white/55 mb-0.5">รายจ่าย</Text>
            <Text className="text-sm font-mono-semibold text-error-500">
              ฿{expense.toLocaleString('th-TH')}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
