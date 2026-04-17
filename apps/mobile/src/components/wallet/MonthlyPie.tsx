import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// ── Pure-RN donut chart (ไม่ต้องพึ่ง react-native-svg) ────────────────────
// รองรับ 2 ชิ้น (รายรับ vs รายจ่าย) — พอสำหรับภาพรวมรายเดือน
//
// แนวคิด: แบ่งวงกลมเป็นครึ่งซ้าย (มุม 180-360°) กับครึ่งขวา (0-180°)
// แต่ละครึ่งใช้ half-disc rotate รอบจุดศูนย์กลาง ให้ clip ด้วย container ครึ่งวง

const SIZE = 170
const THICKNESS = 22

function HalfSlice({
  side, color, rotation,
}: { side: 'left' | 'right'; color: string; rotation: number }) {
  // flat edge ติดศูนย์กลางวง, curved ยื่นออกนอก
  return (
    <View style={{
      position: 'absolute',
      width: SIZE / 2,
      height: SIZE,
      top: 0,
      [side]: 0,
      overflow: 'hidden',
    } as any}>
      <View style={{
        width: SIZE / 2,
        height: SIZE,
        backgroundColor: color,
        borderTopRightRadius:    side === 'right' ? SIZE / 2 : 0,
        borderBottomRightRadius: side === 'right' ? SIZE / 2 : 0,
        borderTopLeftRadius:     side === 'left'  ? SIZE / 2 : 0,
        borderBottomLeftRadius:  side === 'left'  ? SIZE / 2 : 0,
        transform: [{ rotate: `${rotation}deg` }],
        transformOrigin: side === 'right' ? 'left center' : 'right center',
      } as any} />
    </View>
  )
}

export function MonthlyPie({
  income, expense,
}: { income: number; expense: number }) {
  const total = income + expense
  const angle = total > 0 ? (income / total) * 360 : 0

  const incomeColor  = Colors.emerald[500]
  const expenseColor = Colors.error[500]
  const net = income - expense

  if (total === 0) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.ring, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
          <View style={styles.hole}>
            <Text style={styles.centerSub}>ยังไม่มีข้อมูล</Text>
          </View>
        </View>
        <View style={styles.legend}>
          <LegendItem color={incomeColor}  label="รายรับ"  amount={0} pct={0} />
          <LegendItem color={expenseColor} label="รายจ่าย" amount={0} pct={0} />
        </View>
      </View>
    )
  }

  // ครึ่งขวา (0-180°): ถ้า angle ≥ 180 เติมเต็ม, ถ้าน้อยกว่าเติมบางส่วน
  const rightRotation = angle >= 180 ? 0 : angle - 180
  const rightColor    = incomeColor
  // ครึ่งซ้าย (180-360°): ถ้า angle ≤ 180 ไม่มีรายรับ (ทั้งครึ่งเป็น expense)
  const leftRotation  = angle <= 180 ? 180 : angle - 360
  const leftColor     = incomeColor

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        {/* ฐาน = expense (แสดงเมื่อ income ยังไม่เต็ม) */}
        <View style={[StyleSheet.absoluteFill, {
          borderRadius: SIZE / 2,
          backgroundColor: expenseColor,
        }]} />

        {/* ครึ่งขวา income */}
        <HalfSlice side="right" color={rightColor} rotation={rightRotation} />
        {/* ครึ่งซ้าย income (โชว์เฉพาะ angle > 180) */}
        {angle > 180 && (
          <HalfSlice side="left" color={leftColor} rotation={leftRotation} />
        )}

        {/* เจาะรู = Donut */}
        <View style={styles.hole}>
          <Text style={styles.centerSub}>คงเหลือสุทธิ</Text>
          <Text style={[
            styles.centerVal,
            { color: net >= 0 ? Colors.emerald[400] : Colors.error[500] },
          ]}>
            {net >= 0 ? '+' : '-'}฿{Math.abs(net).toLocaleString('th-TH')}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendItem
          color={incomeColor}
          label="รายรับ"
          amount={income}
          pct={Math.round((income / total) * 100)}
        />
        <LegendItem
          color={expenseColor}
          label="รายจ่าย"
          amount={expense}
          pct={Math.round((expense / total) * 100)}
        />
      </View>
    </View>
  )
}

function LegendItem({
  color, label, amount, pct,
}: { color: string; label: string; amount: number; pct: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={styles.legendHead}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendPct}>{pct}%</Text>
      </View>
      <Text style={[styles.legendAmount, { color }]}>
        ฿{amount.toLocaleString('th-TH')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16, width: '100%' },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    width: SIZE - THICKNESS * 2,
    height: SIZE - THICKNESS * 2,
    borderRadius: (SIZE - THICKNESS * 2) / 2,
    backgroundColor: Colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerSub: { fontSize: 10, color: Colors.text.muted, marginBottom: 2 },
  centerVal: { fontSize: 16, fontWeight: '800' },

  legend: { flexDirection: 'row', gap: 12, width: '100%' },
  legendItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  legendHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: Colors.text.muted, flex: 1 },
  legendPct: { fontSize: 11, fontWeight: '700', color: Colors.text.primary },
  legendAmount: { fontSize: 14, fontWeight: '800' },
})
