import React, { useState } from 'react';
import { UserPlus, Trash2, LogOut, RotateCcw, ChevronDown, ChevronUp, Plus, Star, X } from 'lucide-react';
import { defaultCategories } from '../data/defaultData';

const AVATARS = ['👤', '👨', '👩', '👴', '👵', '🧑', '🧔', '👱'];
const CAT_ICONS = ['🩸', '💊', '🫀', '🦴', '🧬', '🔬', '🏥', '⚕️', '🧪', '💉'];

export default function Settings({
  categories, setCategories,
  currentUser, users,
  onUpdateUser, onDeleteUser, onAddUser, onLogout
}) {
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState({ text: '', ok: false });

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '👤');

  const [showAddUser, setShowAddUser] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAvatar, setAddAvatar] = useState('🧑');
  const [addPin, setAddPin] = useState('');

  const [expandedCat, setExpandedCat] = useState(null);

  // ====== 新增：指标管理相关状态 ======
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔬');

  const [addingIndCatId, setAddingIndCatId] = useState(null);
  const [newIndName, setNewIndName] = useState('');
  const [newIndUnit, setNewIndUnit] = useState('');
  const [newIndRefMin, setNewIndRefMin] = useState('');
  const [newIndRefMax, setNewIndRefMax] = useState('');
  const [newIndIsCore, setNewIndIsCore] = useState(false);

  // ====== 口令修改 ======
  const handlePinChange = () => {
    setPinMsg({ text: '', ok: false });
    if (oldPin !== currentUser.pin) {
      setPinMsg({ text: '当前口令不正确', ok: false });
      return;
    }
    if (newPin.length < 4) {
      setPinMsg({ text: '新口令至少4位数字', ok: false });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMsg({ text: '两次输入不一致', ok: false });
      return;
    }
    onUpdateUser(currentUser.id, { pin: newPin });
    setPinMsg({ text: '口令修改成功！', ok: true });
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => { setShowPinChange(false); setPinMsg({ text: '', ok: false }); }, 1500);
  };

  const handleProfileSave = () => {
    if (!editName.trim()) return;
    onUpdateUser(currentUser.id, { name: editName.trim(), avatar: editAvatar });
    setEditingProfile(false);
  };

  const handleAddUser = () => {
    if (!addName.trim() || addPin.length < 4) return;
    onAddUser({ name: addName.trim(), avatar: addAvatar, pin: addPin });
    setAddName('');
    setAddAvatar('🧑');
    setAddPin('');
    setShowAddUser(false);
  };

  // ====== 新增：分类操作 ======
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: 'cat_' + Date.now(),
      name: newCatName.trim(),
      icon: newCatIcon,
      indicators: [],
    };
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatIcon('🔬');
    setShowAddCat(false);
  };

  const handleDeleteCategory = (catId) => {
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(c => c.id !== catId));
    if (expandedCat === catId) setExpandedCat(null);
  };

  // ====== 新增：指标操作 ======
  const handleAddIndicator = (catId) => {
    if (!newIndName.trim() || !newIndUnit.trim()) return;
    const newInd = {
      id: 'ind_' + Date.now(),
      name: newIndName.trim(),
      unit: newIndUnit.trim(),
      refMin: newIndRefMin !== '' ? parseFloat(newIndRefMin) : null,
      refMax: newIndRefMax !== '' ? parseFloat(newIndRefMax) : null,
      isCore: newIndIsCore,
    };
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return { ...cat, indicators: [...(cat.indicators || []), newInd] };
    }));
    setNewIndName('');
    setNewIndUnit('');
    setNewIndRefMin('');
    setNewIndRefMax('');
    setNewIndIsCore(false);
    setAddingIndCatId(null);
  };

  const handleDeleteIndicator = (catId, indId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return { ...cat, indicators: (cat.indicators || []).filter(i => i.id !== indId) };
    }));
  };

  const toggleCore = (catId, indId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        indicators: (cat.indicators || []).map(ind =>
          ind.id === indId ? { ...ind, isCore: !ind.isCore } : ind
        ),
      };
    }));
  };

  const resetAddIndForm = () => {
    setAddingIndCatId(null);
    setNewIndName('');
    setNewIndUnit('');
    setNewIndRefMin('');
    setNewIndRefMax('');
    setNewIndIsCore(false);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">设置</h1>

      {/* ===== 个人信息 ===== */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">个人信息</h2>
        {editingProfile ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setEditAvatar(a)}
                  className={`text-2xl p-1.5 rounded-lg transition-all ${editAvatar === a ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-50'}`}>
                  {a}
                </button>
              ))}
            </div>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="用户名称" />
            <div className="flex gap-2">
              <button onClick={handleProfileSave}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">保存</button>
              <button onClick={() => setEditingProfile(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentUser.avatar}</span>
              <span className="font-medium text-gray-800">{currentUser.name}</span>
            </div>
            <button onClick={() => { setEditName(currentUser.name); setEditAvatar(currentUser.avatar); setEditingProfile(true); }}
              className="text-sm text-blue-500">修改</button>
          </div>
        )}
      </section>

      {/* ===== 修改口令 ===== */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500">登录口令</h2>
          <button onClick={() => { setShowPinChange(!showPinChange); setPinMsg({ text: '', ok: false }); }}
            className="text-sm text-blue-500">{showPinChange ? '收起' : '修改口令'}</button>
        </div>
        {showPinChange && (
          <div className="mt-3 space-y-3">
            <input type="password" inputMode="numeric" value={oldPin} onChange={e => setOldPin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="当前口令" />
            <input type="password" inputMode="numeric" value={newPin} onChange={e => setNewPin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="新口令（至少4位数字）" />
            <input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="确认新口令" />
            {pinMsg.text && (
              <p className={`text-xs ${pinMsg.ok ? 'text-green-500' : 'text-red-500'}`}>{pinMsg.text}</p>
            )}
            <button onClick={handlePinChange}
              className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">确认修改</button>
          </div>
        )}
      </section>

      {/* ===== 用户管理 ===== */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">用户管理</h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{u.avatar}</span>
                <span className="text-sm text-gray-700">{u.name}</span>
                {u.id === currentUser.id && (
                  <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">当前</span>
                )}
              </div>
              {u.id !== currentUser.id && users.length > 1 && (
                <button onClick={() => onDeleteUser(u.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {showAddUser ? (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAddAvatar(a)}
                  className={`text-xl p-1 rounded transition-all ${addAvatar === a ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}>
                  {a}
                </button>
              ))}
            </div>
            <input value={addName} onChange={e => setAddName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="用户名称（如：爸爸、妈妈）" />
            <input type="password" inputMode="numeric" value={addPin} onChange={e => setAddPin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="设置口令（至少4位数字）" />
            <div className="flex gap-2">
              <button onClick={handleAddUser} disabled={!addName.trim() || addPin.length < 4}
                className="flex-1 py-2 bg-blue-500 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium">添加</button>
              <button onClick={() => setShowAddUser(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddUser(true)}
            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm flex items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-500 transition-colors">
            <UserPlus size={16} /> 添加新用户
          </button>
        )}
      </section>

      {/* ===== 指标管理 ===== */}
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">指标管理</h2>
          <button onClick={() => { if (window.confirm?.('确定要重置为默认指标吗？自定义的分类和指标将丢失。')) setCategories(defaultCategories); }}
            className="text-xs text-gray-400 flex items-center gap-1 hover:text-blue-500 transition-colors">
            <RotateCcw size={12} /> 重置默认
          </button>
        </div>

        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="bg-gray-50 rounded-lg overflow-hidden">
              {/* 分类标题行 */}
              <button
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <span className="text-xs text-gray-400">({(cat.indicators || []).length}项)</span>
                </div>
                {expandedCat === cat.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {/* 展开后的指标列表 */}
              {expandedCat === cat.id && (
                <div className="px-3 pb-3 space-y-2">
                  {Array.isArray(cat.indicators) && cat.indicators.map(ind => (
                    <div key={ind.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-700 truncate">{ind.name}</span>
                          <span className="text-xs text-gray-400">({ind.unit})</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          参考: {ind.refMin ?? '-'} ~ {ind.refMax ?? '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {/* 核心指标切换 */}
                        <button
                          onClick={() => toggleCore(cat.id, ind.id)}
                          title={ind.isCore ? '取消关键指标' : '设为关键指标'}
                          className={`p-1 rounded transition-colors ${ind.isCore ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                        >
                          <Star size={16} fill={ind.isCore ? 'currentColor' : 'none'} />
                        </button>
                        {/* 删除指标 */}
                        <button
                          onClick={() => handleDeleteIndicator(cat.id, ind.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 添加指标表单 */}
                  {addingIndCatId === cat.id ? (
                    <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                      <input value={newIndName} onChange={e => setNewIndName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="指标名称（如：白细胞计数）" />
                      <div className="flex gap-2">
                        <input value={newIndUnit} onChange={e => setNewIndUnit(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="单位（如：×10⁹/L）" />
                      </div>
                      <div className="flex gap-2">
                        <input type="number" value={newIndRefMin} onChange={e => setNewIndRefMin(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="参考下限" />
                        <span className="self-center text-gray-400 text-sm">~</span>
                        <input type="number" value={newIndRefMax} onChange={e => setNewIndRefMax(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="参考上限" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newIndIsCore} onChange={e => setNewIndIsCore(e.target.checked)}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400" />
                        <span className="text-sm text-gray-600">设为关键指标（首页优先显示）</span>
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => handleAddIndicator(cat.id)}
                          disabled={!newIndName.trim() || !newIndUnit.trim()}
                          className="flex-1 py-1.5 bg-blue-500 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium">
                          确认添加
                        </button>
                        <button onClick={resetAddIndForm}
                          className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { resetAddIndForm(); setAddingIndCatId(cat.id); }}
                      className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 flex items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-500 transition-colors"
                    >
                      <Plus size={14} /> 添加指标
                    </button>
                  )}

                  {/* 删除分类 */}
                  {categories.length > 1 && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="w-full py-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      删除此分类
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 添加新分类 */}
        {showAddCat ? (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-2">
              {CAT_ICONS.map(icon => (
                <button key={icon} onClick={() => setNewCatIcon(icon)}
                  className={`text-xl p-1.5 rounded-lg transition-all ${newCatIcon === icon ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-white'}`}>
                  {icon}
                </button>
              ))}
            </div>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="分类名称（如：肿瘤标志物）" />
            <div className="flex gap-2">
              <button onClick={handleAddCategory} disabled={!newCatName.trim()}
                className="flex-1 py-2 bg-blue-500 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium">
                添加分类
              </button>
              <button onClick={() => { setShowAddCat(false); setNewCatName(''); }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                取消
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddCat(true)}
            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm flex items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-500 transition-colors">
            <Plus size={16} /> 添加新分类
          </button>
        )}
      </section>

      {/* ===== 退出登录 ===== */}
      <button onClick={onLogout}
        className="w-full py-3 bg-white rounded-xl shadow-sm text-red-500 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
        <LogOut size={16} /> 退出登录
      </button>
    </div>
  );
}