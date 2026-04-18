import React from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import { useAuthStore } from '../../../src/store/auth.store'

// ── Sub Components ─────────────────────────────────────

function SettingRow({
  icon, label, sub, onPress, danger = false, chevron = true, disabled = false,
}: {
  icon: string
  label: string
  sub?: string
  onPress?: () => void
  danger?: boolean
  chevron?: boolean
  disabled?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
      disabled={!onPress || disabled}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger, disabled && styles.rowLabelDisabled]}>
          {label}
        </Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {chevron && onPress && !disabled && (
        <Text style={[styles.chevron, danger && { color: Colors.error[500] }]}>›</Text>
      )}
      {disabled && (
        <Text style={styles.comingSoon}>เร็วๆ นี้</Text>
      )}
    </TouchableOpacity>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

// ── Main Screen ────────────────────────────────────────

export default function SettingsScreen() {
  const { user } = useAuthStore()

  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>
  const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ')
  const displayName = fullName
    || meta.username
    || meta.full_name
    || user?.email?.split('@')[0]
    || 'ผู้ใช้'
  const email = user?.email ?? ''
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'ต้องการออกจากระบบใช่ไหม?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            const { supabase } = await import('../../../src/services/supabase')
            await supabase.auth.signOut()
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตั้งค่า ⚙️</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(app)/settings/profile')}
          accessibilityLabel="แก้ไขชื่อผู้ใช้"
          accessibilityRole="button"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* ── บัญชีและภาษี ── */}
        <SectionHeader title="บัญชีและภาษี" />
        <SectionCard>
          <SettingRow
            icon="🧾"
            label="Tax Profile"
            sub="รายได้ต่อปี สถานภาพ จำนวนบุตร"
            onPress={() => router.push('/(app)/settings/tax-profile')}
          />
          <SettingRow
            icon="🎨"
            label="จัดการหมวดหมู่"
            sub="เพิ่ม / แก้ไข หมวดหมู่รายรับ-รายจ่าย"
            onPress={() => router.push('/(app)/settings/categories')}
          />
          <SettingRow
            icon="💰"
            label="Budget รายเดือน"
            sub="ตั้งวงเงินรายจ่ายต่อเดือน"
            onPress={() => router.push('/(app)/settings/budget')}
          />
          <SettingRow
            icon="📤"
            label="ออกรายงาน PDF / Excel"
            sub="สรุปรายรับ-รายจ่าย / ภาษี"
            onPress={() => router.push('/(app)/settings/export')}
          />
        </SectionCard>

        {/* ── การแจ้งเตือน & ความปลอดภัย ── */}
        <SectionHeader title="การแจ้งเตือน & ความปลอดภัย" />
        <SectionCard>
          <SettingRow
            icon="🔔"
            label="การแจ้งเตือน"
            sub="ภาษี / Budget / สลิปใหม่"
            onPress={() => router.push('/(app)/settings/notifications')}
          />
          <SettingRow
            icon="🔒"
            label="ความปลอดภัย · PIN / Face ID"
            sub="ตั้งค่าการล็อกแอป"
            onPress={() => router.push('/(app)/settings/security')}
          />
        </SectionCard>

        {/* ── อื่นๆ ── */}
        <SectionHeader title="อื่นๆ" />
        <SectionCard>
          <SettingRow
            icon="📡"
            label="Offline Queue"
            sub="ดูรายการที่ยังไม่ถูก sync"
            onPress={() => router.push('/(app)/settings/queue')}
          />
          <SettingRow
            icon="ℹ️"
            label="เกี่ยวกับแอป · v1.0.0"
            chevron={false}
          />
        </SectionCard>

        {/* ── ออกจากระบบ ── */}
        <SectionCard>
          <SettingRow
            icon="🚪"
            label="ออกจากระบบ"
            onPress={handleLogout}
            danger
          />
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  headerTitle: {
    ...TextStyles.h1,
    fontSize: 20,
  },

  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    gap: 4,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.navy[500],
    borderRadius: Radius['3xl'],
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.emerald.dim,
    borderWidth: 2,
    borderColor: Colors.emerald.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TextStyles.h2,
    fontSize: 20,
    color: Colors.emerald[400],
  },
  profileInfo: { flex: 1 },
  profileName: { ...TextStyles.h3, fontSize: 16 },
  profileEmail: {
    ...TextStyles.bodySm,
    color: Colors.text.muted,
    marginTop: 2,
  },

  // Section
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
  },
  card: {
    backgroundColor: Colors.navy[500],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing[4],
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  rowDisabled: { opacity: 0.5 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: Colors.error.dim },
  rowIconText: { fontSize: 18 },
  rowBody: { flex: 1 },
  rowLabel: {
    ...TextStyles.bodyLg,
    fontSize: 14,
    color: Colors.text.primary,
  },
  rowLabelDanger: { color: Colors.error[400] },
  rowLabelDisabled: { color: Colors.text.muted },
  rowSub: {
    ...TextStyles.bodySm,
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  chevron: { fontSize: 22, color: Colors.text.muted },
  comingSoon: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.muted,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
})