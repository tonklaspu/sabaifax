import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radius } from './src/constants'

// ── Sub-components ────────────────────────────────

function StatusBarRow() {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>9:41</Text>
      <View style={styles.statusRight}>
        <Text style={styles.statusText}>5G</Text>
        <Text style={styles.statusText}>⚡</Text>
      </View>
    </View>
  )
}

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
  focused?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  focused = false,
  onFocus,
  onBlur,
}: InputFieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.disabled}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType={secureTextEntry ? 'default' : 'email-address'}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  )
}

function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>หรือเข้าสู่ระบบด้วย</Text>
      <View style={styles.dividerLine} />
    </View>
  )
}

interface SocialButtonProps {
  label: string
  onPress: () => void
}

function SocialButton({ label, onPress }: SocialButtonProps) {
  return (
    <TouchableOpacity style={styles.socialBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.socialBtnText}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Main Screen ───────────────────────────────────

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleLogin = () => {
    // TODO: connect to auth API
  }

  const handleRegister = () => {
    // TODO: navigate to register screen
  }

  const handleForgotPassword = () => {
    // TODO: navigate to forgot password screen
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
      <StatusBarRow />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header / Logo */}
          <Logo />

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="อีเมล"
              value={email}
              onChangeText={setEmail}
              placeholder="user@email.com"
              focused={emailFocused}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />

            <InputField
              label="รหัสผ่าน"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              focused={passwordFocused}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            {/* Primary CTA */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>

            {/* OR divider */}
            <Divider />

            {/* Social login */}
            <View style={styles.socialRow}>
              <SocialButton label="🇬 Google" onPress={() => {}} />
              <SocialButton label="  Apple" onPress={() => {}} />
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
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

  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[2],
  },
  statusTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusRight: { flexDirection: 'row', gap: 5 },
  statusText: {
    fontSize: 11,
    color: Colors.text.primary,
  },

  // Logo / header
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
    // gradient approximated with solid emerald brand color
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
    fontWeight: '400',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Form
  form: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    gap: 12,
  },

  // Input field
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.input,
    paddingHorizontal: 17,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text.primary,
  },
  inputFocused: {
    backgroundColor: 'rgba(0,200,150,0.05)',
    borderColor: 'rgba(0,200,150,0.5)',
  },

  // Forgot password
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald[500],
  },

  // Primary button
  btnPrimary: {
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navy[700],
  },

  // OR divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
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

  // Social buttons
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

  // Register link
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
