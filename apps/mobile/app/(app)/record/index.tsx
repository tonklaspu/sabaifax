import React from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, Shadow, TextStyles } from '../../../src/constants'

// ── Config ─────────────────────────────────────────────

const METHODS = [
  {
    key: 'manual',
    icon: '✏️',
    title: 'บันทึกเอง',
    desc: 'กรอกรายการด้วยตัวเอง เลือกประเภทและหมวดหมู่',
    color: Colors.emerald[500],
    dimColor: Colors.emerald.dim,
    borderColor: Colors.emerald.border,
    route: '/(app)/record/manual',
  },
  {
    key: 'scanner',
    icon: '📷',
    title: 'สแกนใบเสร็จ',
    desc: 'ถ่ายรูปใบเสร็จ ระบบจะอ่านข้อมูลให้อัตโนมัติ',
    color: Colors.info[500],
    dimColor: Colors.info.dim,
    borderColor: Colors.info.border,
    route: '/(app)/record/scanner',
  },
] as const

// ── Screen ─────────────────────────────────────────────

export default function RecordIndexScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บันทึกรายการ</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>เลือกวิธีบันทึก</Text>

        {METHODS.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.card, { borderColor: m.borderColor }]}
            onPress={() => router.push(m.route as any)}
            activeOpacity={0.75}
            disabled={false}
          >
            <View style={[styles.cardIcon, { backgroundColor: m.dimColor }]}>
              <Text style={styles.cardIconText}>{m.icon}</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{m.title}</Text>
                  </View>
              <Text style={styles.cardDesc}>{m.desc}</Text>
            </View>

            <Text style={[styles.arrow, { color: m.color }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backBtn: { padding: 4, marginRight: 8 },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { flex: 1, ...TextStyles.h2, fontSize: 18 },

  content: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
  },
  subtitle: {
    ...TextStyles.bodyMd,
    color: Colors.text.muted,
    marginBottom: Spacing[4],
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: Spacing[4],
    borderRadius: Radius['4xl'],
    backgroundColor: Colors.navy[500],
    borderWidth: 1,
    marginBottom: Spacing[3],
    ...Shadow.md,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: { ...TextStyles.h3, fontSize: 16 },
  cardDesc: { ...TextStyles.bodyMd, fontSize: 13 },

  arrow: { fontSize: 28, fontWeight: '300' },
})
