import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useScanStore } from '../../../src/store/scan.store'
import { recognizeReceipt } from '../../../src/services/ocr.service'
import { Button } from '../../../src/components'

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing] = useState<CameraType>('back')
  const [processing, setProcessing] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const { setPendingImage, setOcrResult } = useScanStore()

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [permission])

  const processAndGoReview = async (uri: string) => {
    setProcessing(true)
    try {
      const ocr = await recognizeReceipt(uri)
      setPendingImage(uri)
      setOcrResult(ocr)
      router.replace('/(app)/record/review')
    } catch {
      setPendingImage(uri)
      setOcrResult(null)
      router.replace('/(app)/record/review')
    } finally {
      setProcessing(false)
    }
  }

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return
    setProcessing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 })
      if (photo?.uri) await processAndGoReview(photo.uri)
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถถ่ายภาพได้')
      setProcessing(false)
    }
  }

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      await processAndGoReview(result.assets[0].uri)
    }
  }

  // Permission: loading
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-navy-800 items-center justify-center">
        <ActivityIndicator color="#00C896" />
      </SafeAreaView>
    )
  }

  // Permission: denied
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-navy-800">
        <StatusBar barStyle="light-content" backgroundColor="#060F1E" />
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Text className="text-[56px] mb-2">📷</Text>
          <Text className="text-xl font-sarabun-bold text-white/95 text-center">
            ต้องการสิทธิ์เข้าถึงกล้อง
          </Text>
          <Text className="text-sm font-sarabun text-white/55 text-center">
            แอปต้องการสิทธิ์กล้องเพื่อสแกนใบเสร็จ
          </Text>
          <Button title="อนุญาตการเข้าถึง" onPress={requestPermission} className="mt-2 w-full" />
          <Button title="ยกเลิก" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  // Camera View
  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Overlay */}
      <View style={StyleSheet.absoluteFill} className="flex-col">
        {/* Top Bar */}
        <SafeAreaView className="flex-row items-center justify-between px-4 pt-2 pb-3 bg-black/45">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Text className="text-xl text-white">✕</Text>
          </TouchableOpacity>
          <Text className="text-base font-sarabun-bold text-white">สแกนใบเสร็จ</Text>
          <View className="w-10" />
        </SafeAreaView>

        {/* Viewfinder */}
        <View className="flex-1 items-center justify-center gap-4">
          <View className="w-[300px] h-[200px] relative">
            {/* Corners */}
            <View className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl" />
            <View className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr" />
            <View className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl" />
            <View className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br" />
          </View>
          <Text className="text-xs font-sarabun text-white/75 text-center">
            วางใบเสร็จให้อยู่ในกรอบ
          </Text>
        </View>

        {/* Bottom Controls */}
        <View className="flex-row items-center justify-around py-8 px-6 bg-black/55">
          <TouchableOpacity className="items-center gap-1.5 min-w-[60px]" onPress={handlePickGallery}>
            <Text className="text-[28px]">🖼️</Text>
            <Text className="text-[11px] font-sarabun-medium text-white">คลังภาพ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`w-[72px] h-[72px] rounded-full items-center justify-center border-4 border-white/40 ${
              processing ? 'bg-emerald-400' : 'bg-white'
            }`}
            onPress={handleCapture}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color="#060F1E" />
            ) : (
              <View className="w-14 h-14 rounded-full bg-white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center gap-1.5 min-w-[60px]"
            onPress={() => router.replace('/(app)/record/manual')}
          >
            <Text className="text-[28px]">✏️</Text>
            <Text className="text-[11px] font-sarabun-medium text-white">กรอกเอง</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
