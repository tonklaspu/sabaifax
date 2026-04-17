import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { z } from 'zod'
import { Colors, Spacing, Radius } from '../../src/constants'
import { supabase } from '../../src/services/supabase'

// ── Schema ────────────────────────────────────────

const forgotSchema = z.object({
  // เปลี่ยนมาใช้ z.email() ตั้งต้นแทน z.string() ครับ
  email: z
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .min(1, 'กรุณากรอกอีเมล'), 
})

// ── Main Screen ───────────────────────────────────

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const validate = (): boolean => {
    const result = forgotSchema.safeParse({ email })
    if (result.success) {
      setEmailError(null)
      return true
    }
    // เปลี่ยนจาก .errors[0].message → .flatten().fieldErrors เพื่อให้ Type ถูกต้อง
    setEmailError(result.error.flatten().fieldErrors.email?.[0] ?? 'ข้อมูลไม่ถูกต้อง')
    return false
  }

  const handleSend = async () => {
    if (!validate()) return

    setLoading(true)
    setGlobalError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          // Deep link กลับมาที่แอป
          redirectTo: 'sabaifax://reset-password',
        }
      )
      if (error) throw error
      setSent(true)
    } catch {
      setGlobalError('ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  // ── Success State ─────────────────────────────

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.successTitle}>ตรวจสอบอีเมลของคุณ</Text>
          <Text style={styles.successText}>
            เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
            {'\n\n'}ลิงก์จะหมดอายุใน 24 ชั่วโมง
          </Text>

          {/* Resend */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setSent(false)}
            accessibilityLabel="ส่งอีเมลอีกครั้ง"
            accessibilityRole="button"
          >
            <Text style={styles.btnSecondaryText}>ส่งอีเมลอีกครั้ง</Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace('/(auth)/login')}
            accessibilityLabel="กลับหน้าเข้าสู่ระบบ"
            accessibilityRole="button"
          >
            <Text style={styles.btnPrimaryText}>กลับหน้าเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Form ──────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="ย้อนกลับ"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← ย้อนกลับ</Text>
        </TouchableOpacity>

        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          <Text style={styles.title}>ลืมรหัสผ่าน?</Text>
          <Text style={styles.subtitle}>
            กรอกอีเมลที่ใช้สมัครสมาชิก{'\n'}
            เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ
          </Text>

          {/* Global Error */}
          {!!globalError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️  {globalError}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>อีเมล</Text>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused,
              !!emailError && styles.inputWrapperError,
            ]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  if (emailError) setEmailError(null)
                }}
                placeholder="user@email.com"
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleSend}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                accessibilityLabel="อีเมล"
              />
            </View>
            {!!emailError && (
              <Text style={styles.fieldError}>{emailError}</Text>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityLabel="ส่งลิงก์รีเซ็ตรหัสผ่าน"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loading
              ? <ActivityIndicator color={Colors.navy[700]} />
              : <Text style={styles.btnPrimaryText}>ส่งลิงก์รีเซ็ตรหัสผ่าน</Text>
            }
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>จำรหัสผ่านได้แล้ว? </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="เข้าสู่ระบบ"
              accessibilityRole="link"
            >
              <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy[800],
  },
  flex: { flex: 1 },

  backBtn: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald[500],
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius['4xl'],
    backgroundColor: 'rgba(0,200,150,0.1)',
    borderWidth: 1,
    borderColor: Colors.border.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 32 },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.muted,
    lineHeight: 22,
  },

  errorBanner: {
    backgroundColor: Colors.error.dim,
    borderWidth: 1,
    borderColor: Colors.error.border,
    borderRadius: Radius.md,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error[500],
  },

  fieldWrapper: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.input,
    paddingHorizontal: 17,
  },
  inputWrapperFocused: {
    backgroundColor: 'rgba(0,200,150,0.05)',
    borderColor: 'rgba(0,200,150,0.5)',
  },
  inputWrapperError: {
    borderColor: Colors.error[500],
    backgroundColor: Colors.error.dim,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text.primary,
  },
  fieldError: {
    fontSize: 11,
    color: Colors.error[500],
    marginTop: -2,
  },

  btnPrimary: {
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy[700],
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.emerald[500],
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.emerald[500],
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  loginLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald[500],
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[4],
  },
  successIcon: { fontSize: 64 },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: Colors.emerald[500],
    fontWeight: '700',
  },
})