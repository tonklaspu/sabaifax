import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  StyleSheet, StatusBar, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import {
  NotifSettings, NotifKey,
  loadNotifSettings, saveNotifSettings,
  requestNotificationPermission,
  configureNotifications,
  registerPushTokenWithServer,
} from '../../../src/services/notification.service'

// ── Config ─────────────────────────────────────────────

interface NotifItem {
  key: NotifKey
  icon: string
  label: string
  sub: string
}

const NOTIF_ITEMS: NotifItem[] = [
  {
    key: 'tax_deadline',
    icon: '📅',
    label: 'แจ้งเตือนยื่นภาษี',
    sub: 'เตือนก่อนถึงกำหนด 31 มี.ค. ล่วงหน้า 30, 7 และ 1 วัน',
  },
  {
    key: 'budget_exceed',
    icon: '⚠️',
    label: 'Budget เกินเป้าหมาย',
    sub: 'เตือนเมื่อรายจ่ายเกิน 80% และ 100% ของเป้าหมาย',
  },
  {
    key: 'daily_summary',
    icon: '📊',
    label: 'สรุปรายวัน',
    sub: 'สรุปรายรับ-รายจ่ายประจำวัน ทุกคืน 21:00',
  },
  {
    key: 'monthly_summary',
    icon: '📆',
    label: 'สรุปรายเดือน',
    sub: 'สรุปรายรับ-รายจ่ายสิ้นเดือน พร้อมเปรียบเทียบเดือนที่แล้ว',
  },
  {
    key: 'slip_scan',
    icon: '🧾',
    label: 'สลิปใหม่ในคลังภาพ',
    sub: 'แจ้งเตือนเมื่อตรวจพบสลิปหรือใบเสร็จใหม่ในอัลบัม',
  },
]

// ── Sub Component ──────────────────────────────────────

function NotifRow({
  item, value, onChange,
}: {
  item: NotifItem; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, !value && styles.rowIconOff]}>
        <Text style={styles.rowIconText}>{item.icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, !value && styles.rowLabelOff]}>{item.label}</Text>
        <Text style={styles.rowSub}>{item.sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.10)', true: Colors.emerald[600] }}
        thumbColor={value ? Colors.emerald[400] : 'rgba(255,255,255,0.4)'}
      />
    </View>
  )
}

// ── Main Screen ────────────────────────────────────────

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotifSettings>({
    tax_deadline: true,
    budget_exceed: true,
    daily_summary: false,
    monthly_summary: true,
    slip_scan: false,
  })
  const [permGranted, setPermGranted] = useState<boolean | null>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    configureNotifications()
    const saved = await loadNotifSettings()
    setSettings(saved)

    const granted = await requestNotificationPermission()
    setPermGranted(granted)

    if (granted) {
      await registerPushTokenWithServer()
    }
  }

  const toggle = async (key: NotifKey, value: boolean) => {
    if (!permGranted) {
      Alert.alert(
        'ต้องการสิทธิ์',
        'กรุณาเปิดสิทธิ์การแจ้งเตือนในการตั้งค่าของอุปกรณ์',
      )
      return
    }

    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await saveNotifSettings(updated)
  }

  const anyOn = Object.values(settings).some(Boolean)

  const toggleAll = async () => {
    const newVal = !anyOn
    const updated: NotifSettings = {
      tax_deadline: newVal,
      budget_exceed: newVal,
      daily_summary: newVal,
      monthly_summary: newVal,
      slip_scan: newVal,
    }
    setSettings(updated)
    await saveNotifSettings(updated)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        <TouchableOpacity onPress={toggleAll} style={styles.toggleAllBtn}>
          <Text style={styles.toggleAllText}>{anyOn ? 'ปิดทั้งหมด' : 'เปิดทั้งหมด'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Banner */}
        {permGranted === false && (
          <View style={styles.warnBanner}>
            <Text style={styles.warnBannerIcon}>⚠️</Text>
            <Text style={styles.warnBannerText}>
              การแจ้งเตือนถูกปิด — กรุณาเปิดสิทธิ์ในการตั้งค่าอุปกรณ์
            </Text>
          </View>
        )}

        {permGranted === true && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>✅</Text>
            <Text style={styles.infoBannerText}>
              การแจ้งเตือนพร้อมใช้งาน — การเปลี่ยนแปลงจะมีผลทันที
            </Text>
          </View>
        )}

        {/* Settings */}
        <View style={styles.card}>
          {NOTIF_ITEMS.map((item, i) => (
            <React.Fragment key={item.key}>
              <NotifRow
                item={item}
                value={settings[item.key]}
                onChange={v => toggle(item.key, v)}
              />
              {i < NOTIF_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  toggleAllBtn: { padding: 8 },
  toggleAllText: { ...TextStyles.bodySm, fontSize: 12, color: Colors.emerald[400], fontWeight: '700' },

  scrollContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[2] },

  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.emerald.dim,
    borderWidth: 1,
    borderColor: Colors.emerald.border,
    borderRadius: Radius.card,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  infoBannerIcon: { fontSize: 18 },
  infoBannerText: { flex: 1, ...TextStyles.bodySm, color: Colors.emerald[400], lineHeight: 18 },

  warnBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.gold.dim,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    borderRadius: Radius.card,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  warnBannerIcon: { fontSize: 18 },
  warnBannerText: { flex: 1, ...TextStyles.bodySm, color: Colors.gold[400], lineHeight: 18 },

  card: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing[4],
    paddingVertical: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconOff: { opacity: 0.4 },
  rowIconText: { fontSize: 20 },
  rowBody: { flex: 1 },
  rowLabel: { ...TextStyles.bodyLg, fontSize: 14 },
  rowLabelOff: { color: Colors.text.muted },
  rowSub: { ...TextStyles.bodySm, fontSize: 11, color: Colors.text.muted, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Colors.border.subtle, marginHorizontal: Spacing[4] },
})
