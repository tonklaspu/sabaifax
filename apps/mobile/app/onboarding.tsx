import React, { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Dimensions, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Colors, Spacing, TextStyles } from '../src/constants'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon: '💰',
    title: 'ยินดีต้อนรับสู่ SabaiTax',
    subtitle: 'จัดการเงินง่าย สบายใจเรื่องภาษี',
    desc: 'บันทึกรายรับ-รายจ่าย ติดตามกระเป๋าเงิน\nและวางแผนภาษีทั้งหมดในแอปเดียว',
  },
  {
    icon: '📸',
    title: 'สแกนสลิปอัตโนมัติ',
    subtitle: 'ไม่ต้องพิมพ์เอง',
    desc: 'ถ่ายรูปสลิปโอนเงิน แอปจะอ่านยอดเงิน\nวันที่ และธนาคารให้อัตโนมัติด้วย OCR',
  },
  {
    icon: '🧾',
    title: 'คำนวณภาษีอัจฉริยะ',
    subtitle: 'จ่ายภาษีถูกต้อง ไม่พลาดลดหย่อน',
    desc: 'จำลองภาษีเงินได้บุคคลธรรมดา\nพร้อมแนะนำค่าลดหย่อนที่ใช้ได้',
  },
]

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true')
      router.replace('/(auth)/login')
    }
  }

  const handleSkip = async () => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true')
    router.replace('/(auth)/login')
  }

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      {/* Logo area */}
      <View style={styles.logoWrap}>
        <View style={styles.logoBg}>
          <Text style={styles.logoText}>ST</Text>
        </View>
      </View>

      {/* Icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>

      {/* Text */}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  )

  const isLast = currentIndex === SLIDES.length - 1

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Skip */}
      <View style={styles.topBar}>
        <View />
        {!isLast && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>ข้าม</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(idx)
        }}
      />

      {/* Bottom */}
      <View style={styles.bottomWrap}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width]
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            })
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            })
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            )
          })}
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.ctaBtnText}>
            {isLast ? 'เริ่มต้นใช้งาน' : 'ถัดไป'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy[900],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  skipText: {
    ...TextStyles.bodyLg,
    color: Colors.text.muted,
    fontSize: 14,
  },

  // Slide
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingBottom: 60,
  },
  logoWrap: {
    marginBottom: 32,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.emerald.dim,
    borderWidth: 2,
    borderColor: Colors.emerald.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.emerald[400],
    letterSpacing: 2,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    ...TextStyles.h1,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...TextStyles.bodyLg,
    color: Colors.emerald[400],
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  desc: {
    ...TextStyles.bodyMd,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
  },

  // Bottom
  bottomWrap: {
    paddingHorizontal: Spacing[4],
    paddingBottom: 32,
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald[500],
  },
  ctaBtn: {
    backgroundColor: Colors.emerald[500],
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnText: {
    ...TextStyles.bodyLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy[900],
  },
})
