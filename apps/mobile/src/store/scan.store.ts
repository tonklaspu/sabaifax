import { create } from 'zustand'
import { OcrResult } from '../services/ocr.service'

interface ScanStore {
  pendingImageUri: string | null
  pendingAssetId:  string | null   // MediaLibrary asset.id (ถ้ามี) — สำหรับ mark processed
  ocrResult: OcrResult | null
  setPendingImage: (uri: string | null, assetId?: string | null) => void
  setOcrResult: (result: OcrResult | null) => void
  clear: () => void
}

export const useScanStore = create<ScanStore>((set) => ({
  pendingImageUri: null,
  pendingAssetId:  null,
  ocrResult: null,
  setPendingImage: (uri, assetId = null) => set({ pendingImageUri: uri, pendingAssetId: assetId }),
  setOcrResult: (result) => set({ ocrResult: result }),
  clear: () => set({ pendingImageUri: null, pendingAssetId: null, ocrResult: null }),
}))
