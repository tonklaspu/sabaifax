import React, { useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView,
  KeyboardAvoidingView, Platform,
  ActivityIndicator, TextInput as RNTextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { z } from 'zod'
import { Colors, Spacing, Radius } from '../../src/constants'
import { supabase } from '../../src/services/supabase'
import { authService } from '../../src/services/auth.service'

// ── Schema ────────────────────────────────────────

const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'กรุณากรอกชื่อ-นามสกุล')
    .min(3, 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร'),
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่าน')
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
})

type RegisterInput = z.infer<typeof registerSchema>
type FieldErrors = Partial<Record<keyof RegisterInput, string>>

// ── Sub Components ────────────────────────────────

function Logo() {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>ST</Text>
      </View>
      <Text style={styles.title}>สร้างบัญชีใหม่</Text>
      <Text style={styles.subtitle}>เริ่มจัดการการเงินกับ SabaiTax</Text>
    </View>
  )
}

interface InputFieldProps {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder: string
  secureTextEntry?: boolean
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  error?: string
  inputRef?: React.RefObject<RNTextInput | null> // รองรับค่า null จาก useRef<RNTextInput>(null)
  returnKeyType?: 'next' | 'done'
  onSubmitEditing?: () => void
  keyboardType?: 'email-address' | 'default'
  autoComplete?: 'name' | 'email' | 'password' | 'off'
}

function InputField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, focused, onFocus, onBlur,
  error, inputRef, returnKeyType = 'next',
  onSubmitEditing, keyboardType = 'default',
  autoComplete = 'off',
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        !!error && styles.inputWrapperError,
      ]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          onBlur={onBlur}
          accessibilityLabel={label}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(p => !p)}
            accessibilityLabel={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && (
        <Text style={styles.fieldError}>{error}</Text>
      )}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────

export default function RegisterScreen() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [focused, setFocused] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)

  // Refs สำหรับ focus ต่อเนื่อง
  const emailRef = useRef<RNTextInput>(null)
  const passwordRef = useRef<RNTextInput>(null)
  const confirmRef = useRef<RNTextInput>(null)

  const setField = (key: keyof typeof form) => (value: string) => {
    setForm(p => ({ ...p, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors(p => ({ ...p, [key]: undefined }))
    }
  }

  const setFocus = (key: keyof typeof focused, value: boolean) =>
    setFocused(p => ({ ...p, [key]: value }))

  const validate = (): boolean => {
    const result = registerSchema.safeParse(form)
    if (result.success) {
      setFieldErrors({})
      return true
    }
    // เปลี่ยนจาก .errors (ไม่มีใน ZodError type) → .flatten().fieldErrors
    const flat = result.error.flatten().fieldErrors
    const errors: FieldErrors = {}
    ;(Object.keys(flat) as Array<keyof RegisterInput>).forEach((field) => {
      const msgs = flat[field]
      if (msgs?.[0]) errors[field] = msgs[0]
    })
    setFieldErrors(errors)
    return false
  }

  const handleRegister = async () => {
    if (!validate()) return

    setLoading(true)
    setGlobalError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { full_name: form.fullName.trim() },
        },
      })
      if (error) throw error
      setSuccess(true)
    } catch (e: any) {
      if (e.message?.includes('already registered')) {
        setGlobalError('อีเมลนี้ถูกใช้งานแล้ว')
      } else {
        setGlobalError('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setSocialLoading(true)
    setGlobalError(null)
    try {
      await authService.loginWithGoogle()
    } catch {
      setGlobalError('สมัครด้วย Google ไม่สำเร็จ')
    } finally {
      setSocialLoading(false)
    }
  }

  const handleAppleSignUp = async () => {
    setSocialLoading(true)
    setGlobalError(null)
    try {
      await authService.loginWithApple()
    } catch {
      setGlobalError('สมัครด้วย Apple ไม่สำเร็จ')
    } finally {
      setSocialLoading(false)
    }
  }

  // ── Success State ─────────────────────────────

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>ยืนยันอีเมลของคุณ</Text>
          <Text style={styles.successText}>
            เราส่งลิงก์ยืนยันไปที่{'\n'}
            <Text style={styles.successEmail}>{form.email}</Text>
            {'\n'}กรุณาตรวจสอบอีเมลของคุณ
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace('/(auth)/login')}
            accessibilityLabel="ไปหน้า Login"
            accessibilityRole="button"
          >
            <Text style={styles.btnPrimaryText}>ไปหน้าเข้าสู่ระบบ</Text>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="ย้อนกลับ"
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← ย้อนกลับ</Text>
          </TouchableOpacity>

          <Logo />

          <View style={styles.form}>
            {/* Global Error */}
            {!!globalError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️  {globalError}</Text>
              </View>
            )}

            {/* ชื่อ-นามสกุล */}
            <InputField
              label="ชื่อ-นามสกุล"
              value={form.fullName}
              onChangeText={setField('fullName')}
              placeholder="ทศพล ปัญญา"
              autoComplete="name"
              focused={focused.fullName}
              onFocus={() => setFocus('fullName', true)}
              onBlur={() => setFocus('fullName', false)}
              error={fieldErrors.fullName}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            {/* อีเมล */}
            <InputField
              label="อีเมล"
              value={form.email}
              onChangeText={setField('email')}
              placeholder="user@email.com"
              keyboardType="email-address"
              autoComplete="email"
              focused={focused.email}
              onFocus={() => setFocus('email', true)}
              onBlur={() => setFocus('email', false)}
              error={fieldErrors.email}
              inputRef={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* รหัสผ่าน */}
            <InputField
              label="รหัสผ่าน"
              value={form.password}
              onChangeText={setField('password')}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              secureTextEntry
              autoComplete="password"
              focused={focused.password}
              onFocus={() => setFocus('password', true)}
              onBlur={() => setFocus('password', false)}
              error={fieldErrors.password}
              inputRef={passwordRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />

            {/* ยืนยันรหัสผ่าน */}
            <InputField
              label="ยืนยันรหัสผ่าน"
              value={form.confirmPassword}
              onChangeText={setField('confirmPassword')}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              secureTextEntry
              autoComplete="off"
              focused={focused.confirmPassword}
              onFocus={() => setFocus('confirmPassword', true)}
              onBlur={() => setFocus('confirmPassword', false)}
              error={fieldErrors.confirmPassword}
              inputRef={confirmRef}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {/* Terms */}
            <Text style={styles.terms}>
              การสมัครสมาชิกถือว่าคุณยอมรับ{' '}
              <Text style={styles.termsLink}>ข้อกำหนดการใช้งาน</Text>
              {' '}และ{' '}
              <Text style={styles.termsLink}>นโยบายความเป็นส่วนตัว</Text>
            </Text>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityLabel="สร้างบัญชี"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loading
                ? <ActivityIndicator color={Colors.navy[700]} />
                : <Text style={styles.btnPrimaryText}>สร้างบัญชี</Text>
              }
            </TouchableOpacity>

            {/* Social Login — เปิดใช้หลังตั้ง Google/Apple OAuth ใน Supabase */}
            {/* <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือสมัครด้วย</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialBtn, socialLoading && styles.btnDisabled]} onPress={handleGoogleSignUp} disabled={socialLoading || loading}>
                <Text style={styles.socialBtnText}>G  Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, socialLoading && styles.btnDisabled]} onPress={handleAppleSignUp} disabled={socialLoading || loading}>
                <Text style={styles.socialBtnText}>  Apple</Text>
              </TouchableOpacity>
            </View> */}

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityLabel="เข้าสู่ระบบ"
                accessibilityRole="link"
              >
                <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing[8],
  },

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

  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    gap: 4,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: Radius['3xl'],
    backgroundColor: Colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy[700],
  },
  title: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 2,
  },

  form: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    gap: 12,
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
  eyeBtn: { padding: 4, marginLeft: 8 },
  eyeIcon: { fontSize: 16 },
  fieldError: {
    fontSize: 11,
    color: Colors.error[500],
    marginTop: -2,
  },

  terms: {
    fontSize: 11,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.emerald[500],
    fontWeight: '700',
  },

  btnPrimary: {
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy[700],
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
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

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 8,
    height: 42,
  },
  socialBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
  },

  // Success State
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