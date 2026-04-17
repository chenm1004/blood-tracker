import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react';

function Medications({ medications, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = { startDate: new Date().toISOString().slice(0, 10), cycleNumber: '', drugName: '', dosage: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const sorted = [...medications].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.drugName.trim()) return;

    if (editingId) {
      onUpdate(editingId, form);
      setEditingId(null);
    } else {
      onAdd(form);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (med) => {
    setForm({
      startDate: med.startDate,
      cycleNumber: med.cycleNumber,
      drugName: med.drugName,
      dosage: med.dosage || '',
      notes: med.notes || '',
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">用药记录</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <Plus size={16} /> 添加
          </button>
        )}
      </div>

      {/* 表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">
              {editingId ? '编辑用药' : '新增用药'}
            </h3>
            <button type="button" onClick={handleCancel} className="text-gray-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">开始日期</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">治疗周期（第几周期）</label>
              <input
                type="number"
                value={form.cycleNumber}
                onChange={(e) => setForm({ ...form, cycleNumber: e.target.value })}
                placeholder="例如: 1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">药物名称</label>
              <input
                type="text"
                value={form.drugName}
                onChange={(e) => setForm({ ...form, drugName: e.target.value })}
                placeholder="例如: 环磷酰胺"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">剂量</label>
              <input
                type="text"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="例如: 500mg"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">备注</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="可选"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {editingId ? '更新' : '保存'}
          </button>
        </form>
      )}

      {/* 列表 */}
      {sorted.length === 0 ? (
        <div className="text-center text-gray-400 py-12">暂无用药记录</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(med => (
            <div key={med.id} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{med.drugName}</span>
                    {med.cycleNumber && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
                        第{med.cycleNumber}周期
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    开始日期: {med.startDate}
                    {med.dosage && <span className="ml-3">剂量: {med.dosage}</span>}
                  </div>
                  {med.notes && <div className="text-xs text-gray-400 mt-1">{med.notes}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(med)} className="text-blue-500 p-1">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => setConfirmDelete(med.id)} className="text-red-400 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {confirmDelete === med.id && (
                <div className="mt-2 pt-2 border-t border-red-100 flex justify-between items-center">
                  <span className="text-xs text-red-600">确认删除？</span>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-gray-200 rounded">取消</button>
                    <button
                      onClick={() => { onDelete(med.id); setConfirmDelete(null); }}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Medications;