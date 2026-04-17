import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Switch, Alert, TextInput, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
// Lazy imports — expo-local-authentication requires native rebuild
let LocalAuthentication: typeof import('expo-local-authentication') | null = null
try { LocalAuthentication = require('expo-local-authentication') } catch {}
import * as SecureStore from 'expo-secure-store'
import { Header, Card, Button } from '../../../src/components'
import { useAuthStore } from '../../../src/store/auth.store'

const PIN_KEY = 'sabaifax_pin'
const BIOMETRIC_KEY = 'sabaifax_biometric_enabled'
const AUTO_LOCK_KEY = 'sabaifax_auto_lock'

type AutoLockOption = '1' | '5' | '15' | '30'
const AUTO_LOCK_OPTIONS: { value: AutoLockOption; label: string }[] = [
  { value: '1',  label: '1 นาที' },
  { value: '5',  label: '5 นาที' },
  { value: '15', label: '15 นาที' },
  { value: '30', label: '30 นาที' },
]

function ToggleRow({
  icon, label, sub, value, onValueChange, disabled = false,
}: {
  icon: string; label: string; sub: string
  value: boolean; onValueChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]">
      <View className="w-9 h-9 rounded-[10px] bg-white/[0.06] items-center justify-center">
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-sarabun-medium text-white/95">{label}</Text>
        <Text className="text-[11px] font-sarabun text-white/55 mt-0.5">{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#00C896' }}
        thumbColor="#fff"
      />
    </View>
  )
}

function ChevronRow({
  icon, label, sub, onPress, danger = false,
}: {
  icon: string; label: string; sub?: string
  onPress?: () => void; danger?: boolean
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`w-9 h-9 rounded-[10px] items-center justify-center ${danger ? 'bg-error-500/[0.13]' : 'bg-white/[0.06]'}`}>
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-sarabun-medium ${danger ? 'text-error-400' : 'text-white/95'}`}>{label}</Text>
        {sub && <Text className="text-[11px] font-sarabun text-white/55 mt-0.5">{sub}</Text>}
      </View>
      {onPress && <Text className={`text-[22px] ${danger ? 'text-error-500' : 'text-white/55'}`}>›</Text>}
    </TouchableOpacity>
  )
}

export default function SecurityScreen() {
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricType, setBiometricType] = useState<string>('Biometric')
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [autoLock, setAutoLock] = useState<AutoLockOption>('5')
  const [showPinModal, setShowPinModal] = useState(false)
  const [showAutoLockModal, setShowAutoLockModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter')

  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    checkBiometric()
    loadSettings()
  }, [])

  const checkBiometric = async () => {
    if (!LocalAuthentication) {
      setBiometricAvailable(false)
      return
    }
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    setBiometricAvailable(compatible && enrolled)

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID')
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Touch ID')
    }
  }

  const loadSettings = async () => {
    const pin = await SecureStore.getItemAsync(PIN_KEY)
    setHasPin(!!pin)

    const bio = await SecureStore.getItemAsync(BIOMETRIC_KEY)
    setBiometricEnabled(bio === 'true')

    const lock = await SecureStore.getItemAsync(AUTO_LOCK_KEY)
    if (lock) setAutoLock(lock as AutoLockOption)
  }

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!LocalAuthentication) {
      Alert.alert('ต้อง Rebuild', 'กรุณา rebuild แอป (expo run:android) เพื่อใช้งาน Biometric')
      return
    }
    if (enabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'ยืนยันตัวตนเพื่อเปิดใช้งาน',
        cancelLabel: 'ยกเลิก',
      })
      if (!result.success) return
    }
    await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? 'true' : 'false')
    setBiometricEnabled(enabled)
  }

  const handlePinSave = async () => {
    if (pinStep === 'enter') {
      if (pinInput.length !== 6) {
        Alert.alert('แจ้งเตือน', 'กรุณาใส่ PIN 6 หลัก')
        return
      }
      setPinStep('confirm')
      setPinConfirm('')
      return
    }

    if (pinConfirm !== pinInput) {
      Alert.alert('ไม่ตรงกัน', 'PIN ไม่ตรงกัน กรุณาลองใหม่')
      setPinStep('enter')
      setPinInput('')
      setPinConfirm('')
      return
    }

    await SecureStore.setItemAsync(PIN_KEY, pinInput)
    setHasPin(true)
    setShowPinModal(false)
    setPinInput('')
    setPinConfirm('')
    setPinStep('enter')
    Alert.alert('สำเร็จ', 'ตั้ง PIN เรียบร้อยแล้ว')
  }

  const handleRemovePin = () => {
    Alert.alert('ลบ PIN', 'ต้องการลบ PIN ใช่ไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync(PIN_KEY)
          setHasPin(false)
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'ลบบัญชีและข้อมูลทั้งหมด',
      'การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบถาวร',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบทั้งหมด',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync(PIN_KEY)
            await SecureStore.deleteItemAsync(BIOMETRIC_KEY)
            await logout()
            router.replace('/(auth)/login')
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />
      <Header title="ความปลอดภัย" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View className="items-center bg-navy-600 rounded-2xl border border-white/[0.08] p-6 mb-3 gap-2">
          <View className="w-16 h-16 rounded-full bg-accent-purple/[0.15] border border-accent-purple/30 items-center justify-center mb-2">
            <Text className="text-[28px]">🔒</Text>
          </View>
          <Text className="text-base font-sarabun-bold text-white/95">ข้อมูลของคุณปลอดภัย</Text>
          <Text className="text-xs font-sarabun text-white/55 text-center leading-[18px]">
            ข้อมูลทางการเงินของคุณ{'\n'}ถูกเข้ารหัสแบบ AES-256
          </Text>
        </View>

        {/* Unlock Methods */}
        <Text className="text-[11px] font-sarabun-bold text-white/55 uppercase tracking-wider px-1 pt-3 pb-1">
          วิธีปลดล็อก
        </Text>
        <View className="bg-navy-500 rounded-xl border border-white/[0.08] overflow-hidden">
          <ToggleRow
            icon={biometricType === 'Face ID' ? '👤' : '👆'}
            label={biometricType}
            sub={`ปลดล็อกด้วย${biometricType}`}
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={!biometricAvailable}
          />
          <ChevronRow
            icon="🔢"
            label={hasPin ? 'เปลี่ยน PIN 6 หลัก' : 'ตั้ง PIN 6 หลัก'}
            sub={hasPin ? 'ตั้งค่าแล้ว' : 'ตั้งรหัส PIN สำรอง'}
            onPress={() => {
              setPinStep('enter')
              setPinInput('')
              setPinConfirm('')
              setShowPinModal(true)
            }}
          />
          {hasPin && (
            <ChevronRow
              icon="🚫"
              label="ลบ PIN"
              onPress={handleRemovePin}
              danger
            />
          )}
        </View>

        {/* Auto Lock */}
        <Text className="text-[11px] font-sarabun-bold text-white/55 uppercase tracking-wider px-1 pt-3 pb-1">
          อื่นๆ
        </Text>
        <View className="bg-navy-500 rounded-xl border border-white/[0.08] overflow-hidden">
          <ChevronRow
            icon="⏱️"
            label="ล็อกอัตโนมัติ"
            sub={`หลังไม่ใช้งาน ${AUTO_LOCK_OPTIONS.find(o => o.value === autoLock)?.label}`}
            onPress={() => setShowAutoLockModal(true)}
          />
        </View>

        {/* Delete Account */}
        <View className="bg-navy-500 rounded-xl border border-white/[0.08] overflow-hidden mt-3">
          <ChevronRow
            icon="🗑️"
            label="ลบบัญชีและข้อมูลทั้งหมด"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-navy-700 rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-sarabun-bold text-white/95 text-center mb-2">
              {pinStep === 'enter' ? 'ตั้ง PIN 6 หลัก' : 'ยืนยัน PIN อีกครั้ง'}
            </Text>
            <Text className="text-xs font-sarabun text-white/55 text-center mb-6">
              {pinStep === 'enter' ? 'ใส่ PIN ที่ต้องการ' : 'ใส่ PIN เดิมอีกครั้งเพื่อยืนยัน'}
            </Text>

            {/* PIN Dots */}
            <View className="flex-row justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map(i => {
                const val = pinStep === 'enter' ? pinInput : pinConfirm
                return (
                  <View
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < val.length ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  />
                )
              })}
            </View>

            <TextInput
              className="bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-4 text-center text-2xl font-mono-semibold text-white/95 tracking-[12px] mb-4"
              value={pinStep === 'enter' ? pinInput : pinConfirm}
              onChangeText={v => {
                const clean = v.replace(/\D/g, '').slice(0, 6)
                pinStep === 'enter' ? setPinInput(clean) : setPinConfirm(clean)
              }}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />

            <View className="flex-row gap-3">
              <Button
                title="ยกเลิก"
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  setShowPinModal(false)
                  setPinInput('')
                  setPinConfirm('')
                  setPinStep('enter')
                }}
              />
              <Button
                title={pinStep === 'enter' ? 'ถัดไป' : 'บันทึก'}
                className="flex-1"
                onPress={handlePinSave}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Auto Lock Modal */}
      <Modal visible={showAutoLockModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-navy-700 rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-sarabun-bold text-white/95 text-center mb-4">
              ล็อกอัตโนมัติ
            </Text>
            <View className="gap-2">
              {AUTO_LOCK_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    autoLock === opt.value
                      ? 'bg-emerald-500/[0.13] border-emerald-500'
                      : 'bg-white/[0.04] border-white/[0.08]'
                  }`}
                  onPress={async () => {
                    setAutoLock(opt.value)
                    await SecureStore.setItemAsync(AUTO_LOCK_KEY, opt.value)
                    setShowAutoLockModal(false)
                  }}
                >
                  <Text className={`flex-1 text-sm font-sarabun-bold ${
                    autoLock === opt.value ? 'text-emerald-400' : 'text-white/70'
                  }`}>
                    {opt.label}
                  </Text>
                  {autoLock === opt.value && (
                    <Text className="text-emerald-400 text-lg font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="ปิด"
              variant="secondary"
              className="mt-4"
              onPress={() => setShowAutoLockModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
