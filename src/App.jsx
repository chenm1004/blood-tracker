import React, { useState, useEffect, useCallback } from 'react';
import { defaultCategories } from './data/defaultData';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import RecordForm from './components/RecordForm';
import RecordHistory from './components/RecordHistory';
import Medications from './components/Medications';
import Settings from './components/Settings';
import { LayoutDashboard, PlusCircle, ClipboardList, Pill, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import * as api from './api';

function App() {
  // ========== 加载状态 ==========
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('正在加载用户列表…');

  // ========== 用户 ==========
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ========== 业务数据 ==========
  const [activePage, setActivePage] = useState('dashboard');
  const [categories, setCategories] = useState(defaultCategories);
  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);

  // ========== 启动时从 Supabase 拉取用户列表 ==========
  useEffect(() => {
    (async () => {
      const fetched = await api.fetchUsers();
      setUsers(fetched);
      setLoading(false);
    })();
  }, []);

  // ========== 登录后拉取该用户的全部数据 ==========
  useEffect(() => {
    if (!currentUser) {
      setDataLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadingMsg('正在加载数据…');

      const [fetchedRecords, fetchedMeds, fetchedCats] = await Promise.all([
        api.fetchRecords(currentUser.id),
        api.fetchMedications(currentUser.id),
        api.fetchCategories(currentUser.id),
      ]);

      if (cancelled) return;
      setRecords(fetchedRecords);
      setMedications(fetchedMeds);
      setCategories(fetchedCats || defaultCategories);
      setDataLoaded(true);
      setActivePage('dashboard');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  // ========== 用户管理 ==========
  const addUser = async (userData) => {
    const newUser = {
      id: 'user_' + Date.now(),
      name: userData.name,
      avatar: userData.avatar,
      pin: userData.pin,
    };
    // 乐观更新：先在本地加上，再写远端
    setUsers(prev => [...prev, newUser]);
    const created = await api.createUser(newUser);
    if (created) {
      await api.saveCategories(created.id, defaultCategories);
    } else {
      // 远端失败则回滚
      setUsers(prev => prev.filter(u => u.id !== newUser.id));
    }
    return newUser;
  };

  const updateUser = async (id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    await api.updateUser(id, updates);
  };

  const deleteUser = async (id) => {
    if (users.length <= 1 || currentUser?.id === id) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    await api.deleteUserFromDB(id);
  };

  const handleLogin = (user) => setCurrentUser(user);
  const handleLogout = () => {
    setCurrentUser(null);
    setDataLoaded(false);
    setEditingRecord(null);
  };

  // ========== 分类修改时自动同步 Supabase ==========
  const handleSetCategories = useCallback((updater) => {
    setCategories(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (currentUser) {
        api.saveCategories(currentUser.id, next);
      }
      return next;
    });
  }, [currentUser]);

  // ========== 检验记录操作 ==========
  const addRecord = async (record) => {
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const created = await api.createRecord(currentUser.id, newRecord);
    if (created) {
      setRecords(prev => [...prev, created]);
    }
    setActivePage('history');
  };

  const updateRecord = async (updatedRecord) => {
    await api.updateRecordInDB(editingRecord.id, updatedRecord);
    setRecords(prev => prev.map(r =>
      r.id === editingRecord.id ? { ...r, ...updatedRecord } : r
    ));
    setEditingRecord(null);
    setActivePage('history');
  };

  const deleteRecord = async (id) => {
    await api.deleteRecordFromDB(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setActivePage('addRecord');
  };

  // ========== 用药操作 ==========
  const addMedication = async (med) => {
    const newMed = { ...med, id: crypto.randomUUID() };
    const created = await api.createMedication(currentUser.id, newMed);
    if (created) {
      setMedications(prev => [...prev, created]);
    }
  };

  const updateMedication = async (id, med) => {
    await api.updateMedicationInDB(id, med);
    setMedications(prev => prev.map(m => m.id === id ? { ...m, ...med } : m));
  };

  const deleteMedication = async (id) => {
    await api.deleteMedicationFromDB(id);
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  // ========== 渲染 ==========

  // 初始加载 & 登录后加载
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{loadingMsg}</p>
        </div>
      </div>
    );
  }

  // 未登录
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
            setCategories={handleSetCategories}
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