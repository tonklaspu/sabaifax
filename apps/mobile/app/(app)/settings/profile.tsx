import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import { useAuthStore } from '../../../src/store/auth.store'

export default function ProfileScreen() {
  const user          = useAuthStore(s => s.user)
  const updateProfile = useAuthStore(s => s.updateProfile)

  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>

  const [username,  setUsername]  = useState(meta.username ?? '')
  const [firstName, setFirstName] = useState(meta.first_name ?? '')
  const [lastName,  setLastName]  = useState(meta.last_name ?? '')
  const [saving, setSaving] = useState(false)

  const email = user?.email ?? ''
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || (username || 'U')
  const initials = displayName.slice(0, 2).toUpperCase()

  const initial = {
    username:  meta.username ?? '',
    firstName: meta.first_name ?? '',
    lastName:  meta.last_name ?? '',
  }
  const dirty = username.trim() !== initial.username
             || firstName.trim() !== initial.firstName
             || lastName.trim() !== initial.lastName

  const usernameValid = username.trim().length === 0 || /^[a-zA-Z0-9_.]{3,20}$/.test(username.trim())
  const canSave = dirty && usernameValid

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await updateProfile({
        username:  username.trim(),
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
      })
      Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', [
        { text: 'ตกลง', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('เกิดข้อผิดพลาด', e?.message ?? 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ข้อมูลส่วนตัว</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ชื่อผู้ใช้ (Username)</Text>
            <TextInput
              style={[styles.input, !usernameValid && styles.inputError]}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น john_doe"
              placeholderTextColor={Colors.text.disabled}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Text style={!usernameValid ? styles.errorHint : styles.hint}>
              {!usernameValid
                ? 'ใช้ได้เฉพาะ a-z, 0-9, _ และ . (3–20 ตัวอักษร)'
                : 'ใช้เข้าสู่ระบบแทนอีเมลได้'}
            </Text>
          </View>

          {/* ชื่อ + นามสกุล */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>ชื่อจริง</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="ชื่อ"
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="words"
                maxLength={40}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>นามสกุล</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="นามสกุล"
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="words"
                maxLength={40}
              />
            </View>
          </View>
          <Text style={styles.hint}>
            ชื่อจริง-นามสกุลจะใช้ตอนคำนวณภาษีและจับคู่ข้อมูลใบกำกับภาษี (e-Tax) ให้ตรงกับบัตรประชาชน
          </Text>

          {/* Email (read-only) */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>อีเมล</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={Colors.navy[700]} />
              : <Text style={styles.saveBtnText}>บันทึก</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { ...TextStyles.h2, fontSize: 16 },

  content: { paddingHorizontal: Spacing[4], paddingTop: Spacing[2], gap: Spacing[3], paddingBottom: Spacing[8] },

  avatarWrap: { alignItems: 'center', paddingVertical: Spacing[4], gap: 6 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.emerald.dim,
    borderWidth: 2, borderColor: Colors.emerald.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...TextStyles.h1, fontSize: 32, color: Colors.emerald[400] },
  displayName: { ...TextStyles.h3, fontSize: 15, color: Colors.text.primary, marginTop: 4 },
  emailText: { fontSize: 12, color: Colors.text.muted },

  row: { flexDirection: 'row', gap: Spacing[3] },

  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.text.secondary },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.input,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: Colors.text.primary,
  },
  inputError: { borderColor: Colors.error[500] },
  inputDisabled: { opacity: 0.6 },
  inputDisabledText: { fontSize: 14, color: Colors.text.muted },
  hint: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  errorHint: { fontSize: 11, color: Colors.error[500], marginTop: 2 },

  saveBtn: {
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  saveBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: Colors.navy[700] },
})
