import { supabase } from './supabase'

// ==================== 用户 ====================

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('获取用户失败:', error); return [] }
  return data || []
}

export async function createUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single()
  if (error) { console.error('创建用户失败:', error); return null }
  return data
}

export async function updateUser(id, updates) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
  if (error) { console.error('更新用户失败:', error); return false }
  return true
}

export async function deleteUserFromDB(id) {
  // 删除该用户的所有关联数据
  await supabase.from('records').delete().eq('user_id', id)
  await supabase.from('medications').delete().eq('user_id', id)
  await supabase.from('user_categories').delete().eq('user_id', id)
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) { console.error('删除用户失败:', error); return false }
  return true
}

// ==================== 检验记录 ====================

export async function fetchRecords(userId) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  if (error) { console.error('获取记录失败:', error); return [] }
  return (data || []).map(r => ({
    id: r.id,
    categoryId: r.category_id,
    date: r.date,
    values: r.indicator_values || {},
    createdAt: r.created_at,
  }))
}

export async function createRecord(userId, record) {
  const { data, error } = await supabase
    .from('records')
    .insert([{
      id: record.id,
      user_id: userId,
      category_id: record.categoryId,
      date: record.date,
      indicator_values: record.values,
      created_at: record.createdAt || new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) { console.error('添加记录失败:', error); return null }
  return {
    id: data.id,
    categoryId: data.category_id,
    date: data.date,
    values: data.indicator_values || {},
    createdAt: data.created_at,
  }
}

export async function updateRecordInDB(id, record) {
  const { error } = await supabase
    .from('records')
    .update({
      category_id: record.categoryId,
      date: record.date,
      indicator_values: record.values,
    })
    .eq('id', id)
  if (error) { console.error('更新记录失败:', error); return false }
  return true
}

export async function deleteRecordFromDB(id) {
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id)
  if (error) { console.error('删除记录失败:', error); return false }
  return true
}

// ==================== 用药记录 ====================

export async function fetchMedications(userId) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true })
  if (error) { console.error('获取用药失败:', error); return [] }
  return (data || []).map(m => ({
    id: m.id,
    startDate: m.start_date,
    cycleNumber: m.cycle_number || '',
    drugName: m.drug_name,
    dosage: m.dosage || '',
    notes: m.notes || '',
  }))
}

export async function createMedication(userId, med) {
  const { data, error } = await supabase
    .from('medications')
    .insert([{
      id: med.id,
      user_id: userId,
      start_date: med.startDate,
      cycle_number: med.cycleNumber || '',
      drug_name: med.drugName,
      dosage: med.dosage || '',
      notes: med.notes || '',
    }])
    .select()
    .single()
  if (error) { console.error('添加用药失败:', error); return null }
  return {
    id: data.id,
    startDate: data.start_date,
    cycleNumber: data.cycle_number || '',
    drugName: data.drug_name,
    dosage: data.dosage || '',
    notes: data.notes || '',
  }
}

export async function updateMedicationInDB(id, med) {
  const { error } = await supabase
    .from('medications')
    .update({
      start_date: med.startDate,
      cycle_number: med.cycleNumber || '',
      drug_name: med.drugName,
      dosage: med.dosage || '',
      notes: med.notes || '',
    })
    .eq('id', id)
  if (error) { console.error('更新用药失败:', error); return false }
  return true
}

export async function deleteMedicationFromDB(id) {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
  if (error) { console.error('删除用药失败:', error); return false }
  return true
}

// ==================== 指标分类 ====================

export async function fetchCategories(userId) {
  const { data, error } = await supabase
    .from('user_categories')
    .select('categories')
    .eq('user_id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null // 没找到记录，用默认
    console.error('获取分类失败:', error)
    return null
  }
  return data?.categories || null
}

export async function saveCategories(userId, categories) {
  const { error } = await supabase
    .from('user_categories')
    .upsert({
      user_id: userId,
      categories: categories,
      updated_at: new Date().toISOString(),
    })
  if (error) { console.error('保存分类失败:', error); return false }
  return true
}