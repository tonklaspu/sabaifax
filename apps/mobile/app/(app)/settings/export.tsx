import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
// Lazy imports — native modules require rebuild (expo run:android)
let Print: typeof import('expo-print') | null = null
let Sharing: typeof import('expo-sharing') | null = null
let FileSystem: typeof import('expo-file-system') | null = null

try { Print = require('expo-print') } catch {}
try { Sharing = require('expo-sharing') } catch {}
try { FileSystem = require('expo-file-system') } catch {}
import { Header, Card, Button } from '../../../src/components'
import { useTransactionStore, Transaction } from '../../../src/store/transaction.store'
import { useWalletStore } from '../../../src/store/wallet.store'

type ExportFormat = 'pdf' | 'csv'
type ExportPeriod = 'month' | 'quarter' | 'year' | 'all'

const PERIODS: { key: ExportPeriod; label: string }[] = [
  { key: 'month',   label: 'เดือนนี้' },
  { key: 'quarter', label: 'ไตรมาสนี้' },
  { key: 'year',    label: 'ปีนี้' },
  { key: 'all',     label: 'ทั้งหมด' },
]

function getDateRange(period: ExportPeriod): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  switch (period) {
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3) * 3
      return { from: new Date(now.getFullYear(), q, 1), to }
    }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to }
    case 'all':
      return { from: new Date(2020, 0, 1), to }
  }
}

function generateHtml(transactions: Transaction[], period: string): string {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  const rows = transactions.map(t => {
    const amt = Number(t.amount)
    return `
    <tr>
      <td>${new Date(t.date).toLocaleDateString('th-TH')}</td>
      <td>${t.type === 'income' ? 'รายรับ' : t.type === 'expense' ? 'รายจ่าย' : 'โอน'}</td>
      <td>${t.category || '-'}</td>
      <td>${t.note || '-'}</td>
      <td style="text-align:right;color:${t.type === 'expense' ? '#FF5C7A' : '#00C896'}">
        ${t.type === 'expense' ? '-' : '+'}฿${Math.abs(amt).toLocaleString('th-TH')}
      </td>
    </tr>
  `}).join('')

  return `
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: sans-serif; padding: 20px; background: #fff; color: #333; }
      h1 { color: #060F1E; font-size: 22px; }
      .summary { display: flex; gap: 20px; margin: 16px 0; }
      .summary div { padding: 12px 16px; border-radius: 8px; }
      .income { background: #e6fff5; color: #00C896; }
      .expense { background: #fff0f3; color: #FF5C7A; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      th { background: #f5f5f5; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
      td { padding: 8px; border-bottom: 1px solid #eee; }
      .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
    </style></head>
    <body>
      <h1>📊 รายงานการเงิน — SabaiTAX</h1>
      <p>ช่วงเวลา: ${period} | จำนวน ${transactions.length} รายการ</p>
      <div class="summary">
        <div class="income"><strong>รายรับ</strong><br/>฿${income.toLocaleString('th-TH')}</div>
        <div class="expense"><strong>รายจ่าย</strong><br/>฿${expense.toLocaleString('th-TH')}</div>
      </div>
      <table>
        <thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>หมายเหตุ</th><th style="text-align:right">จำนวน</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer">สร้างโดย SabaiTAX — ${new Date().toLocaleDateString('th-TH')}</p>
    </body>
    </html>
  `
}

function generateCsv(transactions: Transaction[]): string {
  const header = 'วันที่,ประเภท,หมวดหมู่,หมายเหตุ,จำนวนเงิน\n'
  const rows = transactions.map(t => {
    const date = new Date(t.date).toLocaleDateString('th-TH')
    const typeLabel = t.type === 'income' ? 'รายรับ' : t.type === 'expense' ? 'รายจ่าย' : 'โอน'
    const n = Number(t.amount)
    const amt = t.type === 'expense' ? -Math.abs(n) : n
    return `${date},${typeLabel},"${t.category || '-'}","${t.note || '-'}",${amt}`
  }).join('\n')
  return header + rows
}

export default function ExportScreen() {
  const { allTransactions, fetchAll } = useTransactionStore()
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [period, setPeriod] = useState<ExportPeriod>('month')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch transactions for the period
      const { from, to } = getDateRange(period)
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        sort: 'date:desc',
      })

      // Use fetchAll which updates allTransactions
      await fetchAll({
        year: from.getFullYear(),
        month: from.getMonth() + 1,
      })

      const transactions = allTransactions
      const periodLabel = PERIODS.find(p => p.key === period)?.label ?? ''

      if (transactions.length === 0) {
        Alert.alert('ไม่มีข้อมูล', 'ไม่พบรายการในช่วงเวลาที่เลือก')
        setExporting(false)
        return
      }

      if (!Print || !Sharing || !FileSystem) {
        Alert.alert('ต้อง Rebuild', 'กรุณา rebuild แอป (expo run:android) เพื่อใช้งาน Export')
        setExporting(false)
        return
      }

      if (format === 'pdf') {
        const html = generateHtml(transactions, periodLabel)
        const { uri } = await Print.printToFileAsync({ html })
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export PDF' })
      } else {
        const csv = generateCsv(transactions)
        const fileUri = FileSystem.documentDirectory + `sabaifax-${period}.csv`
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 })
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export CSV' })
      }
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'ไม่สามารถ Export ได้')
    } finally {
      setExporting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />
      <Header title="Export รายงาน" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Banner */}
        <View className="items-center py-6 mb-4">
          <View className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center mb-4">
            <Text className="text-4xl">📄</Text>
          </View>
          <Text className="text-base font-sarabun-bold text-white/95">ส่งออกรายงานการเงิน</Text>
          <Text className="text-xs font-sarabun text-white/55 mt-1">เลือกรูปแบบและช่วงเวลาที่ต้องการ</Text>
        </View>

        {/* Format */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            รูปแบบไฟล์
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 p-4 rounded-2xl border items-center gap-2 ${
                format === 'pdf'
                  ? 'bg-emerald-500/[0.13] border-emerald-500'
                  : 'bg-white/[0.04] border-white/[0.08]'
              }`}
              onPress={() => setFormat('pdf')}
            >
              <Text className="text-3xl">📑</Text>
              <Text className={`text-sm font-sarabun-bold ${format === 'pdf' ? 'text-emerald-400' : 'text-white/70'}`}>
                PDF
              </Text>
              <Text className="text-[10px] font-sarabun text-white/55">สวยงาม พร้อมพิมพ์</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 p-4 rounded-2xl border items-center gap-2 ${
                format === 'csv'
                  ? 'bg-emerald-500/[0.13] border-emerald-500'
                  : 'bg-white/[0.04] border-white/[0.08]'
              }`}
              onPress={() => setFormat('csv')}
            >
              <Text className="text-3xl">📊</Text>
              <Text className={`text-sm font-sarabun-bold ${format === 'csv' ? 'text-emerald-400' : 'text-white/70'}`}>
                CSV / Excel
              </Text>
              <Text className="text-[10px] font-sarabun text-white/55">เปิดใน Excel ได้</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period */}
        <View className="mb-4">
          <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
            ช่วงเวลา
          </Text>
          <View className="gap-2">
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p.key}
                className={`flex-row items-center p-4 rounded-2xl border ${
                  period === p.key
                    ? 'bg-emerald-500/[0.13] border-emerald-500'
                    : 'bg-white/[0.04] border-white/[0.08]'
                }`}
                onPress={() => setPeriod(p.key)}
              >
                <Text className={`flex-1 text-sm font-sarabun-bold ${
                  period === p.key ? 'text-emerald-400' : 'text-white/70'
                }`}>
                  {p.label}
                </Text>
                {period === p.key && (
                  <Text className="text-emerald-400 text-lg font-bold">✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      <View className="p-4 pb-7 border-t border-white/[0.08]">
        <Button
          title={exporting ? 'กำลัง Export...' : `Export เป็น ${format.toUpperCase()}`}
          onPress={handleExport}
          loading={exporting}
          disabled={exporting}
        />
      </View>
    </SafeAreaView>
  )
}
