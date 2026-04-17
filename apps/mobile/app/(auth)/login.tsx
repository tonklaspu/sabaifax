import React, { useRef, useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView,
  KeyboardAvoidingView, Platform,
  ActivityIndicator, TextInput as RNTextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius } from '../../src/constants'
import { authService } from '../../src/services/auth.service'
import { loginSchema } from '../../src/utils/validation'

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 30_000 // 30 วินาที

// ── Sub-components ────────────────────────────────

function Logo() {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>ST</Text>
      </View>
      <Text style={styles.title}>ยินดีต้อนรับ</Text>
      <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการการเงินของคุณ</Text>
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
  inputRef?: React.RefObject<RNTextInput | null>
  returnKeyType?: 'next' | 'done'
  onSubmitEditing?: () => void
  keyboardType?: 'email-address' | 'default'
  autoComplete?: 'email' | 'password' | 'off'
}

function InputField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, focused, onFocus, onBlur,
  error, inputRef, returnKeyType = 'done',
  onSubmitEditing, keyboardType = 'default',
  autoComplete = 'off',
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = secureTextEntry

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
          secureTextEntry={isPassword && !showPassword}
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
        {/* Show/Hide password toggle */}
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(p => !p)}
            accessibilityLabel={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Inline field error */}
      {!!error && (
        <Text style={styles.fieldError}>{error}</Text>
      )}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [identifierFocused, setIdentifierFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string
    password?: string
  }>({})

  // Rate limiting
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  // Ref สำหรับ focus ไปยัง password field อัตโนมัติ
  const passwordRef = useRef<RNTextInput | null>(null)

  // ── Helpers ────────────────────────────────

  const isLocked = useCallback((): boolean => {
    if (!lockedUntil) return false
    if (Date.now() >= lockedUntil) {
      setLockedUntil(null)
      setAttempts(0)
      return false
    }
    return true
  }, [lockedUntil])

  const getRemainingLockSeconds = (): number =>
    lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0

  const validate = (): boolean => {
    const result = loginSchema.safeParse({ identifier, password })
    if (result.success) {
      setFieldErrors({})
      return true
    }

    const errors: { identifier?: string; password?: string } = {}
    result.error.issues.forEach((e) => {
      const field = e.path[0] as 'identifier' | 'password'
      if (!errors[field]) errors[field] = e.message
    })
    setFieldErrors(errors)
    return false
  }

  // ── Handlers ────────────────────────────────

  const handleLogin = async () => {
    // ตรวจ lock
    if (isLocked()) {
      setGlobalError(`ลองใหม่อีก ${getRemainingLockSeconds()} วินาที`)
      return
    }

    // Validate
    if (!validate()) return

    setLoading(true)
    setGlobalError(null)

    try {
      await authService.login(identifier, password)
      setAttempts(0)
      router.replace('/(app)')
    } catch (e: any) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      // Lock หลังจากพยายาม 5 ครั้ง
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCK_DURATION_MS)
        setGlobalError('พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารอ 30 วินาที')
      } else {
        setGlobalError(e?.message === 'ไม่พบชื่อผู้ใช้นี้'
          ? 'ไม่พบชื่อผู้ใช้นี้'
          : 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setGlobalError(null)
    try {
      await authService.loginWithGoogle()
    } catch {
      setGlobalError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setLoading(true)
    setGlobalError(null)
    try {
      await authService.loginWithApple()
    } catch {
      setGlobalError('เข้าสู่ระบบด้วย Apple ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = () => router.push('/(auth)/register')
  const handleForgotPassword = () => router.push('/(auth)/forgot-password')

  // ── Render ────────────────────────────────

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
          <Logo />

          <View style={styles.form}>

            {/* Global Error Banner */}
            {!!globalError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️  {globalError}</Text>
              </View>
            )}

            {/* Email หรือ Username */}
            <InputField
              label="อีเมล หรือ ชื่อผู้ใช้"
              value={identifier}
              onChangeText={(v) => {
                setIdentifier(v)
                if (fieldErrors.identifier) setFieldErrors(p => ({ ...p, identifier: undefined }))
              }}
              placeholder="user@email.com หรือ username"
              keyboardType="default"
              autoComplete="off"
              focused={identifierFocused}
              onFocus={() => setIdentifierFocused(true)}
              onBlur={() => setIdentifierFocused(false)}
              error={fieldErrors.identifier}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* Password */}
            <InputField
              label="รหัสผ่าน"
              value={password}
              onChangeText={(v) => {
                setPassword(v)
                if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined }))
              }}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              focused={passwordFocused}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              error={fieldErrors.password}
              inputRef={passwordRef}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={handleForgotPassword}
              accessibilityLabel="ลืมรหัสผ่าน"
              accessibilityRole="button"
            >
              <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.btnPrimary, (loading || isLocked()) && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading || isLocked()}
              activeOpacity={0.85}
              accessibilityLabel="เข้าสู่ระบบ"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading || isLocked() }}
            >
              {loading
                ? <ActivityIndicator color={Colors.navy[700]} />
                : <Text style={styles.btnPrimaryText}>เข้าสู่ระบบ</Text>
              }
            </TouchableOpacity>

            {/* Social Login — เปิดใช้หลังตั้ง Google/Apple OAuth ใน Supabase */}
            {/* <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือเข้าสู่ระบบด้วย</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
                <Text style={styles.socialBtnText}>G  Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin}>
                <Text style={styles.socialBtnText}>  Apple</Text>
              </TouchableOpacity>
            </View> */}

            {/* Register */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity
                onPress={handleRegister}
                accessibilityLabel="สมัครสมาชิก"
                accessibilityRole="link"
              >
                <Text style={styles.registerLink}>สมัครสมาชิก</Text>
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

  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
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
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 2,
  },

  form: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    gap: 12,
  },

  // Error Banner
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

  // Input
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
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  eyeIcon: { fontSize: 16 },
  fieldError: {
    fontSize: 11,
    color: Colors.error[500],
    marginTop: -2,
  },

  // Forgot
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald[500],
  },

  // Buttons
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

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  registerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  registerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald[500],
  },
})