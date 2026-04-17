import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  StyleSheet, StatusBar, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Spacing, Radius, TextStyles } from '../../../src/constants'
import { useCategoryStore, Category } from '../../../src/store/category.store'
import { TransactionType } from '../../../src/store/transaction.store'

// ── Config ─────────────────────────────────────────────

const TYPE_TABS: { key: TransactionType; label: string; color: string }[] = [
  { key: 'expense',  label: 'รายจ่าย', color: Colors.error[500] },
  { key: 'income',   label: 'รายรับ',  color: Colors.emerald[500] },
  { key: 'transfer', label: 'โอน',     color: Colors.info[500] },
]

// ── Add/Edit Modal ─────────────────────────────────────

function CategoryModal({
  visible,
  initial,
  type,
  iconOptions,
  onSave,
  onClose,
}: {
  visible: boolean
  initial?: Category
  type: TransactionType
  iconOptions: string[]
  onSave: (label: string, icon: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon,  setIcon]  = useState(initial?.icon ?? iconOptions[0])

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่ชื่อหมวดหมู่')
      return
    }
    onSave(label.trim(), icon)
  }

  // reset เมื่อ modal เปิดใหม่
  React.useEffect(() => {
    if (visible) {
      setLabel(initial?.label ?? '')
      setIcon(initial?.icon ?? iconOptions[0])
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>
          {initial ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
        </Text>

        {/* Preview */}
        <View style={styles.preview}>
          <Text style={styles.previewIcon}>{icon}</Text>
          <Text style={styles.previewLabel}>{label || 'ชื่อหมวดหมู่'}</Text>
        </View>

        {/* Label Input */}
        <Text style={styles.modalFieldLabel}>ชื่อหมวดหมู่</Text>
        <TextInput
          style={styles.modalInput}
          value={label}
          onChangeText={setLabel}
          placeholder="เช่น กาแฟ, ค่าเดินทาง..."
          placeholderTextColor={Colors.text.placeholder}
          maxLength={20}
          autoFocus
        />

        {/* Icon Picker */}
        <Text style={styles.modalFieldLabel}>ไอคอน</Text>
        <View style={styles.iconGrid}>
          {iconOptions.map(ic => (
            <TouchableOpacity
              key={ic}
              style={[styles.iconChip, icon === ic && styles.iconChipActive]}
              onPress={() => setIcon(ic)}
            >
              <Text style={styles.iconChipText}>{ic}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Main Screen ────────────────────────────────────────

export default function CategoriesScreen() {
  const { categories, iconOptions, addCategory, updateCategory, deleteCategory, getByType } = useCategoryStore()

  const [activeType, setActiveType] = useState<TransactionType>('expense')
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()

  const list = getByType(activeType)

  const isDefault = (id: string) =>
    id.startsWith('exp_') || id.startsWith('inc_') || id.startsWith('tra_')

  const handleAdd = () => {
    setEditing(undefined)
    setModalVisible(true)
  }

  const handleEdit = (cat: Category) => {
    if (isDefault(cat.id)) return
    setEditing(cat)
    setModalVisible(true)
  }

  const handleSave = (label: string, icon: string) => {
    if (editing) {
      updateCategory(editing.id, { label, icon })
    } else {
      addCategory({ label, icon, type: activeType })
    }
    setModalVisible(false)
  }

  const handleDelete = (cat: Category) => {
    if (isDefault(cat.id)) {
      Alert.alert('ไม่สามารถลบได้', 'หมวดหมู่เริ่มต้นไม่สามารถลบได้')
      return
    }
    Alert.alert('ลบหมวดหมู่', `ลบ "${cat.label}" ใช่ไหม?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteCategory(cat.id) },
    ])
  }

  const activeColor = TYPE_TABS.find(t => t.key === activeType)!.color

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>จัดการหมวดหมู่</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Text style={[styles.addBtnText, { color: activeColor }]}>+ เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      {/* Type Tabs */}
      <View style={styles.tabRow}>
        {TYPE_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeType === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
            onPress={() => setActiveType(t.key)}
          >
            <Text style={[styles.tabText, activeType === t.key && { color: t.color, fontWeight: '700' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const def = isDefault(item.id)
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={def ? 1 : 0.7}
            >
              <View style={[styles.rowIcon, { backgroundColor: activeColor + '22' }]}>
                <Text style={styles.rowIconText}>{item.icon}</Text>
              </View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              {def
                ? <Text style={styles.defaultBadge}>ค่าเริ่มต้น</Text>
                : (
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </TouchableOpacity>
                )
              }
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>ยังไม่มีหมวดหมู่</Text>
          </View>
        }
      />

      <CategoryModal
        visible={modalVisible}
        initial={editing}
        type={activeType}
        iconOptions={iconOptions}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backBtn: { padding: 4, marginRight: 8 },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { flex: 1, ...TextStyles.h2, fontSize: 18 },
  addBtn: { padding: 8 },
  addBtnText: { ...TextStyles.bodyLg, fontSize: 14, fontWeight: '800' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    marginHorizontal: Spacing[4],
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { ...TextStyles.bodyLg, fontSize: 14, color: Colors.text.muted },

  // List
  listContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: { fontSize: 20 },
  rowLabel: { flex: 1, ...TextStyles.bodyLg, fontSize: 14 },
  defaultBadge: {
    ...TextStyles.caption,
    fontSize: 10,
    color: Colors.text.disabled,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.badge,
  },
  deleteIcon: { fontSize: 18 },

  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { ...TextStyles.bodyMd, color: Colors.text.muted },

  // Modal
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.navy[700],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing[5],
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  sheetTitle: { ...TextStyles.h3, fontSize: 17, marginBottom: Spacing[4] },

  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.card,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  previewIcon: { fontSize: 28 },
  previewLabel: { ...TextStyles.bodyLg, fontSize: 16, color: Colors.text.secondary },

  modalFieldLabel: {
    ...TextStyles.label,
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...TextStyles.bodyLg,
    fontSize: 15,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },

  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing[5],
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: Colors.emerald.dim,
    borderColor: Colors.emerald[500],
  },
  iconChipText: { fontSize: 22 },

  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
  },
  cancelBtnText: { ...TextStyles.bodyLg, fontSize: 14, color: Colors.text.muted },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.button,
    backgroundColor: Colors.emerald[500],
    alignItems: 'center',
  },
  saveBtnText: { ...TextStyles.bodyLg, fontSize: 14, fontWeight: '800', color: Colors.navy[800] },
})
