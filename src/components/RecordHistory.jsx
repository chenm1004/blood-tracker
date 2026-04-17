import React, { useState } from 'react';
import { Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function RecordHistory({ categories, records, onEdit, onDelete }) {
  const [filterCatId, setFilterCatId] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = records.filter(
    r => filterCatId === 'all' || r.categoryId === filterCatId
  );

  // 按日期+分类合并
  const groupMap = {};
  filtered.forEach(record => {
    const key = `${record.date}_${record.categoryId}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        key,
        date: record.date,
        categoryId: record.categoryId,
        records: [],
        values: {},
      };
    }
    groupMap[key].records.push(record);
    // 合并指标值，后上传的覆盖先上传的
    Object.entries(record.values || {}).forEach(([indId, val]) => {
      if (val !== undefined && val !== '') {
        groupMap[key].values[indId] = val;
      }
    });
  });

  const groups = Object.values(groupMap).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const getCatName = catId =>
    categories.find(c => c.id === catId)?.name || '未知分类';

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">历史记录</h1>

      {/* 分类筛选 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilterCatId('all')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
            filterCatId === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCatId(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filterCatId === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="text-center text-gray-400 py-12">暂无记录</div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const cat = categories.find(c => c.id === group.categoryId);
            const coreInds = cat?.indicators.filter(i => i.isCore) || [];
            const isExpanded = expandedId === group.key;
            const allInds = cat?.indicators || [];
            const filledInds = allInds.filter(
              i =>
                group.values[i.id] !== undefined && group.values[i.id] !== ''
            );

            return (
              <div
                key={group.key}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* 头部 */}
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="text-sm font-medium text-gray-800">
                        {group.date}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {getCatName(group.categoryId)}
                      </span>
                      {group.records.length > 1 && (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-500 text-xs rounded-full">
                          已合并{group.records.length}条
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onEdit({
                            ...group.records[0],
                            values: { ...group.values },
                          })
                        }
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(group.key)}
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
                      const val = group.values[ind.id];
                      if (val === undefined || val === '') return null;
                      const numVal = parseFloat(val);
                      const isLow = numVal < ind.refMin;
                      const isHigh = numVal > ind.refMax;
                      return (
                        <span key={ind.id} className="text-xs">
                          <span className="text-gray-500">{ind.name}: </span>
                          <span
                            className={`font-medium ${
                              isLow
                                ? 'text-blue-600'
                                : isHigh
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {val}
                          </span>
                          <span className="text-gray-400 ml-0.5">
                            {ind.unit}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  {/* 展开/收起 */}
                  {filledInds.length >
                    coreInds.filter(i => group.values[i.id]).length && (
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : group.key)
                      }
                      className="flex items-center gap-1 text-xs text-blue-500 mt-2"
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {isExpanded ? '收起' : '查看全部指标'}
                    </button>
                  )}
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      {filledInds.map(ind => {
                        const val = group.values[ind.id];
                        const numVal = parseFloat(val);
                        const isLow = numVal < ind.refMin;
                        const isHigh = numVal > ind.refMax;
                        return (
                          <div key={ind.id} className="text-xs">
                            <span className="text-gray-500">{ind.name}</span>
                            <div>
                              <span
                                className={`font-medium ${
                                  isLow
                                    ? 'text-blue-600'
                                    : isHigh
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {val}
                              </span>
                              <span className="text-gray-400 ml-1">
                                {ind.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 删除确认 */}
                {confirmDelete === group.key && (
                  <div className="border-t border-red-100 p-3 bg-red-50 flex justify-between items-center">
                    <span className="text-sm text-red-600">
                      确认删除
                      {group.records.length > 1
                        ? `这${group.records.length}条合并记录`
                        : '此条记录'}
                      ？
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1 text-sm bg-gray-200 rounded"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          group.records.forEach(r => onDelete(r.id));
                          setConfirmDelete(null);
                        }}
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
