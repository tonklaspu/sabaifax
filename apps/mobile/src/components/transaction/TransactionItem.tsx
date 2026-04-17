import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

type TransactionItemProps = {
  id: string
  title: string
  note?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  date: string
}

function formatAmount(amount: number, type: string) {
  const abs = Math.abs(amount).toLocaleString('th-TH')
  if (type === 'expense') return `-฿${abs}`
  if (type === 'income') return `+฿${abs}`
  return `฿${abs}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  })
}

export function TransactionItem({ id, title, note, amount, type, date }: TransactionItemProps) {
  const amountColor = {
    expense: 'text-error-500',
    income: 'text-emerald-400',
    transfer: 'text-info-400',
  }[type]

  return (
    <TouchableOpacity
      className="flex-row items-center py-3.5 border-b border-white/[0.06]"
      onPress={() => router.push(`/(app)/transaction/${id}` as any)}
    >
      <View className="flex-1">
        <Text className="text-[13px] font-sarabun-bold text-white/95">
          {title || 'ไม่มีชื่อ'}
        </Text>
        {note ? (
          <Text className="text-[11px] font-sarabun text-white/55 mt-0.5" numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>
      <View className="items-end gap-0.5">
        <Text className={`text-[13px] font-mono-semibold ${amountColor}`}>
          {formatAmount(amount, type)}
        </Text>
        <Text className="text-[10px] font-sarabun text-white/55">
          {formatDate(date)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
