import React, { useState, useEffect } from 'react';
import { defaultCategories } from './data/defaultData';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import RecordForm from './components/RecordForm';
import RecordHistory from './components/RecordHistory';
import Medications from './components/Medications';
import Settings from './components/Settings';
import { LayoutDashboard, PlusCircle, ClipboardList, Pill, Settings as SettingsIcon } from 'lucide-react';

function App() {
  // ========== 用户列表（全局共享） ==========
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('app_users');
      if (saved) return JSON.parse(saved);
      const oldPin = localStorage.getItem('app_pin') || '1234';
      return [{ id: 'user1', name: '用户1', pin: oldPin, avatar: '👤' }];
    } catch {
      return [{ id: 'user1', name: '用户1', pin: '1234', avatar: '👤' }];
    }
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  // ========== 用户维度数据 ==========
  const [activePage, setActivePage] = useState('dashboard');
  const [categories, setCategories] = useState(defaultCategories);
  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);

  // 登录后加载该用户数据
  useEffect(() => {
    if (!currentUser) {
      setDataLoaded(false);
      return;
    }
    const p = currentUser.id;

    // 迁移旧版单用户数据到 user1
    if (p === 'user1' && !localStorage.getItem(`${p}_bt_records`) && localStorage.getItem('bt_records')) {
      ['bt_categories', 'bt_records', 'bt_medications'].forEach(key => {
        const old = localStorage.getItem(key);
        if (old) {
          localStorage.setItem(`${p}_${key}`, old);
          localStorage.removeItem(key);
        }
      });
    }

    const load = (key, fallback) => {
      try {
        const saved = localStorage.getItem(`${p}_${key}`);
        return saved ? JSON.parse(saved) : fallback;
      } catch { return fallback; }
    };

    setCategories(load('bt_categories', defaultCategories));
    setRecords(load('bt_records', []));
    setMedications(load('bt_medications', []));
    setDataLoaded(true);
    setActivePage('dashboard');
  }, [currentUser]);

  // 持久化（仅在数据加载完成后）
  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    localStorage.setItem(`${currentUser.id}_bt_categories`, JSON.stringify(categories));
  }, [categories, currentUser, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    localStorage.setItem(`${currentUser.id}_bt_records`, JSON.stringify(records));
  }, [records, currentUser, dataLoaded]);

  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    localStorage.setItem(`${currentUser.id}_bt_medications`, JSON.stringify(medications));
  }, [medications, currentUser, dataLoaded]);

  // ========== 用户管理 ==========
  const addUser = (userData) => {
    const newUser = { ...userData, id: 'user_' + Date.now() };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (id) => {
    if (users.length <= 1) return;
    if (currentUser?.id === id) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    ['bt_categories', 'bt_records', 'bt_medications'].forEach(key => {
      localStorage.removeItem(`${id}_${key}`);
    });
  };

  const handleLogin = (user) => setCurrentUser(user);
  const handleLogout = () => {
    setCurrentUser(null);
    setDataLoaded(false);
    setEditingRecord(null);
  };

  // ========== 记录操作 ==========
  const addRecord = (record) => {
    setRecords(prev => [...prev, { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
    setActivePage('history');
  };

  const updateRecord = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...updatedRecord } : r));
    setEditingRecord(null);
    setActivePage('history');
  };

  const deleteRecord = (id) => setRecords(prev => prev.filter(r => r.id !== id));

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setActivePage('addRecord');
  };

  // ========== 用药操作 ==========
  const addMedication = (med) => setMedications(prev => [...prev, { ...med, id: crypto.randomUUID() }]);
  const updateMedication = (id, med) => setMedications(prev => prev.map(m => m.id === id ? { ...m, ...med } : m));
  const deleteMedication = (id) => setMedications(prev => prev.filter(m => m.id !== id));

  // ========== 渲染 ==========
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} onAddUser={addUser} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard categories={categories} records={records} medications={medications} />;
      case 'addRecord':
        return (
          <RecordForm
            categories={categories}
            onSave={editingRecord ? updateRecord : addRecord}
            editingRecord={editingRecord}
            onCancel={() => { setEditingRecord(null); setActivePage('dashboard'); }}
          />
        );
      case 'history':
        return (
          <RecordHistory
            categories={categories}
            records={records}
            onEdit={handleEditRecord}
            onDelete={deleteRecord}
          />
        );
      case 'medications':
        return (
          <Medications
            medications={medications}
            onAdd={addMedication}
            onUpdate={updateMedication}
            onDelete={deleteMedication}
          />
        );
      case 'settings':
        return (
          <Settings
            categories={categories}
            setCategories={setCategories}
            currentUser={currentUser}
            users={users}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onAddUser={addUser}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'dashboard', label: '概览', Icon: LayoutDashboard },
    { id: 'addRecord', label: '添加', Icon: PlusCircle },
    { id: 'history', label: '历史', Icon: ClipboardList },
    { id: 'medications', label: '用药', Icon: Pill },
    { id: 'settings', label: '管理', Icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部用户栏 */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentUser.avatar}</span>
            <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            切换用户
          </button>
        </div>
      </div>
      <div className="max-w-lg mx-auto">
        {renderPage()}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id !== 'addRecord') setEditingRecord(null);
                setActivePage(id);
              }}
              className={`flex flex-col items-center px-2 py-1 text-xs transition-colors ${
                activePage === id ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="mt-1">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;