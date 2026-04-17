import { create } from 'zustand'
import { OcrResult } from '../services/ocr.service'

interface ScanStore {
  pendingImageUri: string | null
  ocrResult: OcrResult | null
  setPendingImage: (uri: string | null) => void
  setOcrResult: (result: OcrResult | null) => void
  clear: () => void
}

export const useScanStore = create<ScanStore>((set) => ({
  pendingImageUri: null,
  ocrResult: null,
  setPendingImage: (uri) => set({ pendingImageUri: uri }),
  setOcrResult: (result) => set({ ocrResult: result }),
  clear: () => set({ pendingImageUri: null, ocrResult: null }),
}))
