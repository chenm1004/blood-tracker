import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';

function Dashboard({ categories, records, medications }) {
  const [activeCatId, setActiveCatId] = useState(categories[0]?.id || '');
  const [showNonCore, setShowNonCore] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState('');

  const activeCat = categories.find(c => c.id === activeCatId);
  const coreIndicators = activeCat?.indicators.filter(i => i.isCore) || [];
  const nonCoreIndicators = activeCat?.indicators.filter(i => !i.isCore) || [];

  // 获取某个指标的最新值
  const getLatestValue = (indicatorId) => {
    const relevant = records
      .filter(r => r.categoryId === activeCatId && r.values[indicatorId] !== undefined && r.values[indicatorId] !== '')
      .sort((a, b) => b.date.localeCompare(a.date));
    return relevant.length > 0 ? parseFloat(relevant[0].values[indicatorId]) : null;
  };

  // 判断指标状态
  const getStatus = (value, indicator) => {
    if (value === null || value === undefined) return 'none';
    if (value < indicator.refMin) return 'low';
    if (value > indicator.refMax) return 'high';
    return 'normal';
  };

  const statusConfig = {
    low: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: '偏低', Icon: TrendingDown },
    high: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: '偏高', Icon: TrendingUp },
    normal: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: '正常', Icon: Minus },
    none: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', label: '暂无', Icon: Minus },
  };

  // 趋势图数据
  const chartIndicator = activeCat?.indicators.find(i => i.id === selectedIndicator);
  const chartData = useMemo(() => {
    if (!selectedIndicator) return [];

    // 1. 先拿检验数据
    const dataPoints = records
      .filter(r => r.categoryId === activeCatId && r.values[selectedIndicator] !== undefined && r.values[selectedIndicator] !== '')
      .map(r => ({
        date: r.date.slice(5),
        fullDate: r.date,
        value: parseFloat(r.values[selectedIndicator]),
      }));

    // 2. 把用药日期也塞进去（值为 null），保证 x 轴上存在这个刻度
    const existingDates = new Set(dataPoints.map(d => d.fullDate));
    medications.forEach(med => {
      if (!existingDates.has(med.startDate)) {
        dataPoints.push({
          date: med.startDate.slice(5),
          fullDate: med.startDate,
          value: null,
        });
        existingDates.add(med.startDate);
      }
    });

    // 3. 按完整日期排序
    dataPoints.sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    return dataPoints;
  }, [records, activeCatId, selectedIndicator, medications]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto'];
    const values = chartData.map(d => d.value).filter(v => v != null && !isNaN(v));
    if (!values.length) return ['auto', 'auto'];
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (chartIndicator) {
      if (chartIndicator.refMin != null && !isNaN(chartIndicator.refMin)) lo = Math.min(lo, chartIndicator.refMin);
      if (chartIndicator.refMax != null && !isNaN(chartIndicator.refMax)) hi = Math.max(hi, chartIndicator.refMax);
    }
    const range = hi - lo;
    const padding = range > 0 ? range * 0.15 : 1;
    return [Math.max(0, Math.floor(lo - padding)), Math.ceil(hi + padding)];
  }, [chartData, chartIndicator]);

  // 用药标记（用于趋势图）
  const medMarkers = useMemo(() => {
    if (!chartData.length) return [];
    return medications.filter(m => {
      const d = m.startDate.slice(5);
      return chartData.some(cd => cd.date === d);
    });
  }, [medications, chartData]);

  const renderIndicatorCard = (indicator) => {
    const value = getLatestValue(indicator.id);
    const status = getStatus(value, indicator);
    const config = statusConfig[status];

    return (
      <div
        key={indicator.id}
        className={`border rounded-lg p-3 cursor-pointer transition-all ${config.bg} ${
          selectedIndicator === indicator.id ? 'ring-2 ring-blue-400' : ''
        }`}
        onClick={() => setSelectedIndicator(indicator.id === selectedIndicator ? '' : indicator.id)}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-gray-500">{indicator.name}</span>
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-bold ${config.color}`}>
            {value !== null ? value : '-'}
          </span>
          <span className="text-xs text-gray-400">{indicator.unit}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          参考: {indicator.refMin} - {indicator.refMax}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">血液指标概览</h1>

      {/* 分类标签 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCatId(cat.id); setShowNonCore(false); setSelectedIndicator(''); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCatId === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {coreIndicators.map(renderIndicatorCard)}
      </div>

      {/* 更多指标 */}
      {nonCoreIndicators.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowNonCore(!showNonCore)}
            className="flex items-center gap-1 text-sm text-blue-600 mb-2"
          >
            {showNonCore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showNonCore ? '收起更多指标' : `查看更多指标 (${nonCoreIndicators.length}项)`}
          </button>
          {showNonCore && (
            <div className="grid grid-cols-2 gap-3">
              {nonCoreIndicators.map(renderIndicatorCard)}
            </div>
          )}
        </div>
      )}

      {/* 趋势图 */}
      {selectedIndicator && chartIndicator && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {chartIndicator.name} 趋势图
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 40, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={yDomain} />
                <Tooltip
                  formatter={(val) => [`${val} ${chartIndicator.unit}`, chartIndicator.name]}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                {/* 参考范围区域 */}
                <ReferenceArea
                  y1={chartIndicator.refMin}
                  y2={chartIndicator.refMax}
                  fill="#22c55e"
                  fillOpacity={0.08}
                  stroke="#22c55e"
                  strokeOpacity={0.3}
                  strokeDasharray="3 3"
                />
                {/* 用药标记线 */}
                {medications.map(med => (
                  <ReferenceLine
                    key={med.id}
                    x={med.startDate.slice(5)}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `第${med.cycleNumber}周期 ${med.drugName}`,
                      position: 'top',
                      fontSize: 10,
                      fill: '#ef4444',
                    }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无该指标的记录数据</div>
          )}
        </div>
      )}

      {!selectedIndicator && (
        <div className="text-center text-gray-400 py-6 text-sm">
          👆 点击上方任意指标卡片查看趋势图
        </div>
      )}
    </div>
  );
}

export default Dashboard;