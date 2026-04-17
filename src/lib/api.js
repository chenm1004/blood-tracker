import { supabase } from './supabase'

// 获取所有记录
export async function fetchRecords(familyId) {
  const { data, error } = await supabase
    .from('blood_records')
    .select('*')
    .eq('family_id', familyId)
    .order('test_date', { ascending: true })

  if (error) {
    console.error('获取记录失败:', error)
    return []
  }
  return data || []
}

// 添加一条记录
export async function addRecord(familyId, record) {
  const { data, error } = await supabase
    .from('blood_records')
    .insert([{ ...record, family_id: familyId }])
    .select()
    .single()

  if (error) {
    console.error('添加记录失败:', error)
    return null
  }
  return data
}

// 删除一条记录
export async function deleteRecord(id) {
  const { error } = await supabase
    .from('blood_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除记录失败:', error)
    return false
  }
  return true
}