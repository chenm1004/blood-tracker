import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Save, X, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function RecordForm({ categories, onSave, editingRecord, onCancel }) {
  const isEditing = !!editingRecord;

  const [categoryId, setCategoryId] = useState(editingRecord?.categoryId || categories[0]?.id || '');
  const [date, setDate] = useState(editingRecord?.date || new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState(editingRecord?.values || {});
  const [showNonCore, setShowNonCore] = useState(false);
  const [saved, setSaved] = useState(false);

  // ====== OCR 状态 ======
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
  const [scanMsg, setScanMsg] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const activeCat = categories.find(c => c.id === categoryId);
  const coreIndicators = activeCat?.indicators.filter(i => i.isCore) || [];
  const nonCoreIndicators = activeCat?.indicators.filter(i => !i.isCore) || [];

  const handleValueChange = (indicatorId, val) => {
    setValues(prev => ({ ...prev, [indicatorId]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) cleaned[k] = v;
    });

    onSave({ categoryId, date, values: cleaned });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (!isEditing) {
      setValues({});
      setPreview(null);
      setScanResult(null);
    }
  };

  // ====== 图片压缩 ======
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1600;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // ====== 指标名称模糊匹配 ======
  const findMatch = (ocrValues, indicator) => {
    if (!ocrValues || typeof ocrValues !== 'object') return null;
    const { name, shortName } = indicator;

    // 1. 精确匹配名称
    if (ocrValues[name] != null) return ocrValues[name];
    // 2. 精确匹配简称
    if (shortName && ocrValues[shortName] != null) return ocrValues[shortName];

    // 3. 大小写不敏感 + 包含匹配
    const nameLower = name.toLowerCase();
    const shortLower = (shortName || '').toLowerCase();
    for (const [key, val] of Object.entries(ocrValues)) {
      if (val == null) continue;
      const keyLower = key.toLowerCase();
      // 大小写不敏感精确匹配
      if (keyLower === nameLower) return val;
      if (shortLower && keyLower === shortLower) return val;
      // AI 可能返回"白细胞"而指标名是"白细胞计数"，或反过来
      if (keyLower.includes(nameLower) || nameLower.includes(keyLower)) return val;
      if (shortLower && (keyLower.includes(shortLower) || shortLower.includes(keyLower))) return val;
    }

    return null;
  };

  // ====== OCR 识别 ======
  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanResult(null);
    setScanMsg('正在识别化验单，请稍候…');

    try {
      const base64 = await compressImage(file);

      // 收集所有分类的所有指标（跨分类智能匹配）
      const allIndicators = categories.flatMap(cat =>
        (cat.indicators || []).map(ind => ({
          name: ind.name,
          shortName: ind.shortName || '',
          unit: ind.unit,
        }))
      );

      const resp = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, indicators: allIndicators }),
      });

      const json = await resp.json();

      if (json.success && json.data) {
        const { date: ocrDate, values: ocrValues } = json.data;

        // 对每个分类统计匹配数量，选出最佳分类
        let bestCatId = categoryId;
        let bestCount = 0;
        const catMatchedValues = {};

        categories.forEach(cat => {
          const matched = {};
          let count = 0;
          (cat.indicators || []).forEach(ind => {
            const val = findMatch(ocrValues, ind);
            if (val != null) {
              matched[ind.id] = String(val);
              count++;
            }
          });
          catMatchedValues[cat.id] = matched;
          if (count > bestCount) {
            bestCount = count;
            bestCatId = cat.id;
          }
        });

        if (bestCount > 0) {
          setCategoryId(bestCatId);
          setValues(prev => ({ ...prev, ...catMatchedValues[bestCatId] }));
          // 如果还有其他分类也匹配到了，展开非核心指标
          if (catMatchedValues[bestCatId]) {
            const matchedIds = new Set(Object.keys(catMatchedValues[bestCatId]));
            const bestCat = categories.find(c => c.id === bestCatId);
            const hasNonCoreMatch = (bestCat?.indicators || []).some(
              ind => !ind.isCore && matchedIds.has(ind.id)
            );
            if (hasNonCoreMatch) setShowNonCore(true);
          }

          if (ocrDate && /^\d{4}-\d{2}-\d{2}$/.test(ocrDate)) {
            setDate(ocrDate);
          }

          const catName = categories.find(c => c.id === bestCatId)?.name || '';
          setScanResult('success');
          setScanMsg(`识别成功！匹配「${catName}」${bestCount} 项指标，请核对后保存`);
        } else {
          setScanResult('error');
          setScanMsg('未能识别到匹配的指标，请手动输入');
        }
      } else {
        setScanResult('error');
        setScanMsg(json.error || '识别失败，请手动输入');
      }
    } catch (err) {
      console.error('OCR 出错:', err);
      setScanResult('error');
      setScanMsg('网络错误，请检查网络后重试');
    }

    setScanning(false);
    e.target.value = '';
  };

  // ====== 渲染指标输入框 ======
  const renderInput = (indicator) => {
    const val = values[indicator.id] || '';
    const numVal = parseFloat(val);
    const isOutOfRange = val !== '' && !isNaN(numVal) && (numVal < indicator.refMin || numVal > indicator.refMax);
    // 是否由 OCR 填入（高亮提示）
    const isOcrFilled = scanResult === 'success' && val !== '';

    return (
      <div key={indicator.id} className="mb-3">
        <label className="block text-sm text-gray-700 mb-1">
          {indicator.name}
          {indicator.shortName && <span className="text-gray-400 ml-1">({indicator.shortName})</span>}
          <span className="text-gray-400 text-xs ml-2">参考: {indicator.refMin}-{indicator.refMax} {indicator.unit}</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={val}
            onChange={(e) => handleValueChange(indicator.id, e.target.value)}
            placeholder="留空则不记录"
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              isOutOfRange
                ? 'border-red-300 focus:ring-red-400 bg-red-50'
                : isOcrFilled
                ? 'border-blue-300 focus:ring-blue-400 bg-blue-50'
                : 'border-gray-200 focus:ring-blue-400'
            }`}
          />
          <span className="text-xs text-gray-400 w-20">{indicator.unit}</span>
        </div>
        {isOutOfRange && (
          <span className="text-xs text-red-500 mt-1 block">
            {numVal < indicator.refMin ? '↓ 低于参考范围' : '↑ 高于参考范围'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          {isEditing ? '编辑记录' : '添加检验记录'}
        </h1>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ====== 📸 拍照识别区 ====== */}
        {!isEditing && (
          <div className="mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-dashed border-blue-300 rounded-xl p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="w-full text-center"
            >
              {scanning ? (
                <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium text-sm">{scanMsg}</span>
                </div>
              ) : (
                <div className="text-blue-700 py-1">
                  <Camera className="w-7 h-7 mx-auto mb-1" />
                  <span className="font-bold text-sm">📸 拍照 / 上传化验单</span>
                  <p className="text-xs text-blue-400 mt-1">自动识别指标数值，支持所有分类</p>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScan}
            />

            {/* 预览图 */}
            {preview && (
              <div className="mt-3 rounded-lg overflow-hidden border border-blue-200">
                <img src={preview} alt="化验单" className="w-full max-h-40 object-contain bg-white" />
              </div>
            )}

            {/* 识别结果 */}
            {scanResult === 'success' && (
              <div className="mt-3 flex items-start gap-2 text-green-600 text-sm bg-green-50 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{scanMsg}</span>
              </div>
            )}
            {scanResult === 'error' && (
              <div className="mt-3 flex items-start gap-2 text-red-500 text-sm bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{scanMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* ====== 日期选择 ====== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">检验日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* ====== 分类选择 ====== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">检验分类</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryId(cat.id);
                  if (!isEditing) setValues({});
                  setScanResult(null);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryId === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ====== 核心指标 ====== */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            核心指标
            {scanResult === 'success' && (
              <span className="text-xs text-blue-500 ml-2 font-normal">
                💡 蓝色底色为识别填入
              </span>
            )}
          </h3>
          {coreIndicators.map(renderInput)}
        </div>

        {/* ====== 非核心指标 ====== */}
        {nonCoreIndicators.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowNonCore(!showNonCore)}
              className="flex items-center gap-1 text-sm text-blue-600 mb-2"
            >
              {showNonCore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showNonCore ? '收起其他指标' : `展开其他指标 (${nonCoreIndicators.length}项)`}
            </button>
            {showNonCore && nonCoreIndicators.map(renderInput)}
          </div>
        )}

        {/* ====== 保存按钮 ====== */}
        <button
          type="submit"
          className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors ${
            saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Save size={18} />
          {saved ? '已保存 ✓' : (isEditing ? '更新记录' : '保存记录')}
        </button>
      </form>
    </div>
  );
}

export default RecordForm;
