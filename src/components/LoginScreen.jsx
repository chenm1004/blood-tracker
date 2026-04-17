import React, { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';

const AVATARS = ['👤', '👨', '👩', '👴', '👵', '🧑', '🧔', '👱'];

export default function LoginScreen({ users = [], onLogin, onAddUser }) {
  const [view, setView] = useState('select');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🧑');
  const [newPin, setNewPin] = useState('');
  const [addStep, setAddStep] = useState('info');

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setPinInput('');
    setError('');
    setView('pin');
  };

  const handlePinSubmit = () => {
    if (pinInput === selectedUser.pin) {
      onLogin(selectedUser);
    } else {
      setError('口令错误，请重试');
      setPinInput('');
    }
  };

  const handleAddUser = () => {
    if (newPin.length < 4) return;
    onAddUser({ name: newName.trim(), pin: newPin, avatar: newAvatar });
    setNewName('');
    setNewPin('');
    setNewAvatar('🧑');
    setAddStep('info');
    setView('select');
  };

  const renderPinDots = (value) => (
    <div className="flex justify-center gap-2 mb-4 h-8">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={`w-3 h-3 rounded-full ${i < value.length ? 'bg-blue-500' : 'bg-gray-200'}`} />
      ))}
    </div>
  );

  const renderKeypad = (value, setValue, onSubmit) => (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button key={n} onClick={() => value.length < 6 && setValue(prev => prev + String(n))}
          className="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-xl font-semibold text-gray-700 transition-colors">
          {n}
        </button>
      ))}
      <button onClick={() => setValue(prev => prev.slice(0, -1))}
        className="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-sm font-medium text-gray-500 transition-colors">
        删除
      </button>
      <button onClick={() => value.length < 6 && setValue(prev => prev + '0')}
        className="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-xl font-semibold text-gray-700 transition-colors">
        0
      </button>
      <button onClick={onSubmit}
        className="h-14 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-bold transition-colors">
        确认
      </button>
    </div>
  );

  // ===== 添加用户 - 设置口令 =====
  if (view === 'add' && addStep === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs text-center">
          <button onClick={() => setAddStep('info')} className="text-gray-400 mb-4 flex items-center gap-1 text-sm">
            <ArrowLeft size={16} /> 返回
          </button>
          <p className="text-sm text-gray-500 mb-1">为 <strong>{newName}</strong> 设置口令</p>
          <p className="text-xs text-gray-400 mb-4">至少4位数字</p>
          {renderPinDots(newPin)}
          {renderKeypad(newPin, setNewPin, handleAddUser)}
        </div>
      </div>
    );
  }

  // ===== 添加用户 - 填写信息 =====
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs">
          <button onClick={() => { setView('select'); setAddStep('info'); }} className="text-gray-400 mb-4 flex items-center gap-1 text-sm">
            <ArrowLeft size={16} /> 返回
          </button>
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">添加新用户</h2>

          <label className="block text-sm text-gray-600 mb-2">选择头像</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setNewAvatar(a)}
                className={`text-2xl p-2 rounded-lg transition-all ${newAvatar === a ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-50'}`}>
                {a}
              </button>
            ))}
          </div>

          <label className="block text-sm text-gray-600 mb-2">用户名称</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="如：爸爸、妈妈"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <button onClick={() => { if (newName.trim()) setAddStep('pin'); }} disabled={!newName.trim()}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold text-sm transition-colors">
            下一步：设置口令
          </button>
        </div>
      </div>
    );
  }

  // ===== 输入口令 =====
  if (view === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs text-center">
          <button onClick={() => setView('select')} className="text-gray-400 mb-4 flex items-center gap-1 text-sm">
            <ArrowLeft size={16} /> 返回
          </button>
          <div className="text-4xl mb-2">{selectedUser.avatar}</div>
          <p className="font-bold text-gray-800 mb-1">{selectedUser.name}</p>
          <p className="text-sm text-gray-500 mb-6">请输入口令</p>
          {renderPinDots(pinInput)}
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {renderKeypad(pinInput, setPinInput, handlePinSubmit)}
        </div>
      </div>
    );
  }

  // ===== 选择用户 =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs text-center">
        <div className="text-5xl mb-4">🩸</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">血液指标追踪</h1>
        <p className="text-sm text-gray-500 mb-6">选择用户</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {users.map(user => (
            <button key={user.id} onClick={() => handleSelectUser(user)}
              className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 transition-all">
              <span className="text-3xl mb-2">{user.avatar}</span>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setView('add')}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm">
          <UserPlus size={16} /> 添加新用户
        </button>
      </div>
    </div>
  );
}