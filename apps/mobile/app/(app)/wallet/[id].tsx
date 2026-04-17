import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useWalletStore, Wallet } from '../../../src/store/wallet.store'
import { api } from '../../../src/services/api.client'
import { Header, Card, BarChart, TransactionItem } from '../../../src/components'

type Transaction = {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  category: string
  note: string
  created_at: string
}

const TYPE_LABELS: Record<Wallet['type'], string> = {
  cash: 'เงินสด',
  bank: 'บัญชีธนาคาร',
  credit: 'บัตรเครดิต',
  savings: 'ออมทรัพย์',
  investment: 'การลงทุน',
  other: 'อื่น ๆ',
}

function build7DayChart(txs: Transaction[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const buckets: { key: string; label: string; income: number; expense: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      label: String(d.getDate()),
      income: 0,
      expense: 0,
    })
  }
  for (const tx of txs) {
    const d = new Date((tx as any).date || tx.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const b = buckets.find(x => x.key === key)
    if (!b) continue
    const amt = Number(tx.amount) || 0
    if (tx.type === 'income')  b.income  += amt
    if (tx.type === 'expense') b.expense += amt
  }
  return buckets.map(({ label, income, expense }) => ({ label, income, expense }))
}

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { wallets, deleteWallet } = useWalletStore()
  const wallet = wallets.find(w => w.id === id)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const chartData = useMemo(() => build7DayChart(transactions), [transactions])
  const hasChartData = chartData.some(b => b.income > 0 || b.expense > 0)
  const [txLoading, setTxLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    loadTransactions()
  }, [id])

  const loadTransactions = async () => {
    setTxLoading(true)
    try {
      const params = new URLSearchParams({ wallet_id: id, limit: '30', sort: 'created_at:desc' })
      const res = await api.get(`/transactions?${params.toString()}`)
      setTransactions(res?.data ?? [])
    } catch {
      // show empty
    } finally {
      setTxLoading(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'ลบกระเป๋า',
      `คุณต้องการลบ "${wallet?.name}" ใช่ไหม?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await deleteWallet(id)
              router.back()
            } catch (err: any) {
              Alert.alert('เกิดข้อผิดพลาด', err?.message ?? 'ลบไม่สำเร็จ')
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  if (!wallet) {
    return (
      <SafeAreaView className="flex-1 bg-navy-800 items-center justify-center gap-3">
        <Text className="text-5xl">😕</Text>
        <Text className="text-base font-sarabun-bold text-white/70">ไม่พบกระเป๋า</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-emerald-500 font-sarabun-bold text-sm">← ย้อนกลับ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <SafeAreaView className="flex-1 bg-navy-800">
      <StatusBar barStyle="light-content" backgroundColor="#060F1E" />

      <Header
        title={wallet.name}
        rightElement={
          <TouchableOpacity
            className="p-2"
            onPress={handleDelete}
            disabled={deleting}
            accessibilityLabel="ลบกระเป๋า"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FF5C7A" />
            ) : (
              <Text className="text-xl">🗑</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Hero */}
        <Card variant="emerald" className="mb-4 p-6 rounded-3xl">
          <Text className="text-[11px] font-sarabun text-white/55 mb-1">ยอดคงเหลือ</Text>
          <Text
            className={`text-[32px] font-mono-semibold tracking-tighter ${
              wallet.balance < 0 ? 'text-error-500' : 'text-white/95'
            }`}
          >
            ฿{wallet.balance.toLocaleString('th-TH')}
          </Text>

          <View className="flex-row gap-2 mt-4">
            <View className="flex-1 items-center gap-1 py-3 rounded-2xl bg-emerald-500/[0.14] border border-emerald-500/25">
              <Text className="text-[10px] font-sarabun text-white/55">รายรับ</Text>
              <Text className="text-sm font-mono-semibold text-emerald-400">
                +฿{income.toLocaleString('th-TH')}
              </Text>
            </View>
            <View className="flex-1 items-center gap-1 py-3 rounded-2xl bg-error-500/[0.12] border border-error-500/25">
              <Text className="text-[10px] font-sarabun text-white/55">รายจ่าย</Text>
              <Text className="text-sm font-mono-semibold text-error-500">
                -฿{expense.toLocaleString('th-TH')}
              </Text>
            </View>
          </View>
        </Card>

        {/* 7-Day Chart */}
        <Card className="mb-4">
          <Text className="text-[13px] font-sarabun-bold text-white/55 mb-3">7 วันล่าสุด</Text>
          {hasChartData ? (
            <BarChart data={chartData} />
          ) : (
            <View className="items-center py-8 gap-2">
              <Text className="text-3xl">📊</Text>
              <Text className="text-xs text-white/45">ยังไม่มีข้อมูลใน 7 วันที่ผ่านมา</Text>
            </View>
          )}
          <View className="flex-row justify-center gap-4 mt-3">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              <Text className="text-[10px] font-sarabun text-white/55">รายรับ</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-sm bg-error-500/70" />
              <Text className="text-[10px] font-sarabun text-white/55">รายจ่าย</Text>
            </View>
          </View>
        </Card>

        {/* Recent Transactions */}
        <View className="mb-4">
          <Text className="text-[13px] font-sarabun-bold text-white/55 mb-3">รายการล่าสุด</Text>

          {txLoading ? (
            <ActivityIndicator color="#00C896" className="mt-6" />
          ) : transactions.length === 0 ? (
            <View className="items-center py-12 gap-2">
              <Text className="text-[40px]">📭</Text>
              <Text className="text-sm font-sarabun-bold text-white/70">ยังไม่มีรายการ</Text>
              <TouchableOpacity
                className="mt-3 px-5 py-2.5 rounded-xl bg-emerald-500"
                onPress={() => router.push('/(app)/record' as any)}
              >
                <Text className="text-navy-800 font-sarabun-bold text-[13px]">+ เพิ่มรายการ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.slice(0, 5).map(tx => (
              <TransactionItem
                key={tx.id}
                id={tx.id}
                title={tx.title || tx.category || 'ไม่มีชื่อ'}
                note={tx.note}
                amount={tx.amount}
                type={tx.type}
                date={tx.created_at}
              />
            ))
          )}
        </View>

        {/* Transfer Button (bottom) */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500"
          onPress={() => router.push({ pathname: '/(app)/wallet/transfer', params: { fromId: id } })}
        >
          <Text className="text-navy-800 text-lg">↗</Text>
          <Text className="text-[15px] font-sarabun-bold text-navy-800">โอนเงิน</Text>
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  )
}
