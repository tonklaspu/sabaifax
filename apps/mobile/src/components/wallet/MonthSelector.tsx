import React, { useMemo, useRef, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

const MONTH_LABEL = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

export function MonthSelector({
  selectedYear, selectedMonth, onChange,
}: {
  selectedYear: number
  selectedMonth: number
  onChange: (year: number, month: number) => void
}) {
  const scrollRef = useRef<ScrollView>(null)

  // แสดง 12 เดือนย้อนหลัง (รวมเดือนนี้)
  const months = useMemo(() => {
    const now = new Date()
    const arr: { year: number; month: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
    }
    return arr
  }, [])

  // auto-scroll ไปยังเดือนที่เลือก (ขวาสุดโดย default)
  useEffect(() => {
    const idx = months.findIndex(m => m.year === selectedYear && m.month === selectedMonth)
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, idx * 76 - 100), animated: false })
    }
  }, [])

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {months.map(({ year, month }) => {
        const active = year === selectedYear && month === selectedMonth
        return (
          <TouchableOpacity
            key={`${year}-${month}`}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(year, month)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipMonth, active && styles.chipTextActive]}>
              {MONTH_LABEL[month - 1]}
            </Text>
            <Text style={[styles.chipYear, active && styles.chipYearActive]}>
              {year + 543}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  chip: {
    width: 68,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 2,
  },
  chipActive: {
    backgroundColor: Colors.emerald[500],
    borderColor: Colors.emerald[400],
  },
  chipMonth: { fontSize: 12, fontWeight: '700', color: Colors.text.primary },
  chipYear:  { fontSize: 10, color: Colors.text.muted },
  chipTextActive: { color: Colors.navy[700] },
  chipYearActive: { color: Colors.navy[700], opacity: 0.7 },
})
