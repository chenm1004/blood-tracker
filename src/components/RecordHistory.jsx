import React, { useState } from 'react';
import { Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function RecordHistory({ categories, records, onEdit, onDelete }) {
  const [filterCatId, setFilterCatId] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = records
    .filter(r => filterCatId === 'all' || r.categoryId === filterCatId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const getCatName = (catId) => categories.find(c => c.id === catId)?.name || '未知分类';

  const getIndicatorInfo = (catId, indId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.indicators.find(i => i.id === indId);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">历史记录</h1>

      {/* 分类筛选 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilterCatId('all')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
            filterCatId === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCatId(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filterCatId === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">暂无记录</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => {
            const cat = categories.find(c => c.id === record.categoryId);
            const coreInds = cat?.indicators.filter(i => i.isCore) || [];
            const isExpanded = expandedId === record.id;
            const allInds = cat?.indicators || [];
            const filledInds = allInds.filter(i => record.values[i.id] !== undefined && record.values[i.id] !== '');

            return (
              <div key={record.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* 头部 */}
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{record.date}</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {getCatName(record.categoryId)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(record)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(record.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 核心指标摘要 */}
                  <div className="flex flex-wrap gap-3">
                    {coreInds.map(ind => {
                      const val = record.values[ind.id];
                      if (val === undefined || val === '') return null;
                      const numVal = parseFloat(val);
                      const isLow = numVal < ind.refMin;
                      const isHigh = numVal > ind.refMax;
                      return (
                        <span key={ind.id} className="text-xs">
                          <span className="text-gray-500">{ind.name}: </span>
                          <span className={`font-medium ${isLow ? 'text-blue-600' : isHigh ? 'text-red-600' : 'text-green-600'}`}>
                            {val}
                          </span>
                          <span className="text-gray-400 ml-0.5">{ind.unit}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* 展开/收起 */}
                  {filledInds.length > coreInds.filter(i => record.values[i.id]).length && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      className="flex items-center gap-1 text-xs text-blue-500 mt-2"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? '收起' : '查看全部指标'}
                    </button>
                  )}
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      {filledInds.map(ind => {
                        const val = record.values[ind.id];
                        const numVal = parseFloat(val);
                        const isLow = numVal < ind.refMin;
                        const isHigh = numVal > ind.refMax;
                        return (
                          <div key={ind.id} className="text-xs">
                            <span className="text-gray-500">{ind.name}</span>
                            <div>
                              <span className={`font-medium ${isLow ? 'text-blue-600' : isHigh ? 'text-red-600' : 'text-green-600'}`}>
                                {val}
                              </span>
                              <span className="text-gray-400 ml-1">{ind.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 删除确认 */}
                {confirmDelete === record.id && (
                  <div className="border-t border-red-100 p-3 bg-red-50 flex justify-between items-center">
                    <span className="text-sm text-red-600">确认删除此条记录？</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1 text-sm bg-gray-200 rounded"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => { onDelete(record.id); setConfirmDelete(null); }}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecordHistory;