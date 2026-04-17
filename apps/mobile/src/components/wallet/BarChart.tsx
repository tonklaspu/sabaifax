import { View, Text } from 'react-native'

type BarData = {
  label: string
  income: number
  expense: number
}

type BarChartProps = {
  data: BarData[]
}

export function BarChart({ data }: BarChartProps) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)

  return (
    <View className="flex-row items-end justify-between h-[120px] px-2">
      {data.map((d) => (
        <View key={d.label} className="items-center flex-1 gap-1">
          <View className="flex-row items-end gap-[2px] h-[100px]">
            <View
              className="w-3 rounded-t bg-emerald-400"
              style={{ height: (d.income / maxVal) * 100 }}
            />
            <View
              className="w-3 rounded-t bg-error-500/70"
              style={{ height: (d.expense / maxVal) * 100 }}
            />
          </View>
          <Text className="text-[9px] font-sarabun text-white/40">{d.label}</Text>
        </View>
      ))}
    </View>
  )
}
