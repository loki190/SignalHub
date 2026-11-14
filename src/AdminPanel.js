// AdminPanel.js - веб-версия
import React, { useState, useEffect } from 'react';
import { getAllUsers, createPlayerById, addDeposit } from './AdminService';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import './AdminPanel.css';

const CreatePlayerModal = ({ visible, onClose, onSuccess }) => {
  const [playerId, setPlayerId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleCreate = async () => {
    if (!playerId.trim()) {
      alert('Ошибка', 'Введите ID игрока');
      return;
    }
    
    setLoading(true);
    const result = await createPlayerById(playerId.trim(), email.trim() || null, phone.trim() || null);
    
    if (result.success) {
      alert(`Игрок с ID ${playerId} успешно создан!`);
      setPlayerId('');
      setEmail('');
      setPhone('');
      onClose();
      if (onSuccess) onSuccess();
    } else {
      alert('Ошибка', result.error);
    }
    setLoading(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-title">СОЗДАТЬ ИГРОКА</div>
        
        <input
          type="text"
          className="admin-input"
          placeholder="ID игрока (обязательно)"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
        />
        
        <input
          type="email"
          className="admin-input"
          placeholder="Email (опционально)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <input
          type="tel"
          className="admin-input"
          placeholder="Телефон (опционально)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        
        <div className="admin-modal-buttons">
          <button className="admin-cancel-button" onClick={onClose}>
            ОТМЕНА
          </button>
          <button className="admin-create-button" onClick={handleCreate} disabled={loading}>
            {loading ? 'СОЗДАНИЕ...' : 'СОЗДАТЬ'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddDepositModal = ({ visible, onClose, userId, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleAddDeposit = async () => {
    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Ошибка', 'Введите корректную сумму депозита');
      return;
    }
    
    setLoading(true);
    const result = await addDeposit(userId, depositAmount);
    
    if (result.success) {
      alert(`Депозит ${depositAmount}₽ успешно добавлен!\nНовый уровень: ${result.newLevel}`);
      setAmount('');
      onClose();
      if (onSuccess) onSuccess();
    } else {
      alert('Ошибка', result.error);
    }
    setLoading(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-title">ДОБАВИТЬ ДЕПОЗИТ</div>
        
        <input
          type="number"
          className="admin-input"
          placeholder="Сумма депозита (₽)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        
        <div className="admin-modal-buttons">
          <button className="admin-cancel-button" onClick={onClose}>
            ОТМЕНА
          </button>
          <button className="admin-create-button" onClick={handleAddDeposit} disabled={loading}>
            {loading ? 'ДОБАВЛЕНИЕ...' : 'ДОБАВИТЬ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminPanel = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    const result = await getAllUsers();
    if (result.success) {
      const players = result.users.filter(user => user.role === 'player');
      setUsers(players);
      setFilteredUsers(players);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserAction = (action, user) => {
    setSelectedUser(user);
    if (action === 'deposit') {
      setShowDepositModal(true);
    }
  };

  const handleResetSearch = () => {
    setFilteredUsers(users);
    setSearchQuery('');
  };

  const handleFilterBySearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        if (user.playerId && typeof user.playerId === 'string') {
          return user.playerId.toLowerCase().includes(text.toLowerCase());
        }
        return false;
      });
      setFilteredUsers(filtered);
    }
  };

  const UserCard = ({ user }) => (
    <div className="admin-user-card">
      <div className="admin-user-header">
        <div className="admin-user-id">ID: {user.playerId || 'Не указан'}</div>
        <div className={`admin-status-badge ${user.status === 'active' ? 'admin-active-badge' : 'admin-inactive-badge'}`}>
          <span className="admin-status-text">{user.status === 'active' ? 'АКТИВЕН' : 'ЗАБЛОКИРОВАН'}</span>
        </div>
      </div>
      
      <div className="admin-user-info">Email: {user.email || 'Не указан'}</div>
      <div className="admin-user-info">Уровень: {user.level || 1}</div>
      <div className="admin-user-info">XP: {user.xp || 0}</div>
      <div className="admin-user-info">Всего депозитов: {user.totalDeposit || 0} ₽</div>
      <div className="admin-user-info">Депозитов в месяце: {user.monthlyDeposits || 0}</div>
      
      <div className="admin-user-actions">
        <button className="admin-action-button admin-deposit-button" onClick={() => handleUserAction('deposit', user)}>
          ➕ Депозит
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-loading-text">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title">👑 АДМИН ПАНЕЛЬ</div>
        <button className="admin-logout-button" onClick={handleLogout}>
          🚪 ВЫЙТИ
        </button>
      </div>
      
      <div className="admin-header-actions">
        <button className="admin-create-user-button" onClick={() => setShowCreateModal(true)}>
          ➕ СОЗДАТЬ ИГРОКА
        </button>
      </div>
      
      <div className="admin-filter-container">
        <input
          type="text"
          className="admin-filter-input"
          placeholder="🔍 Поиск по ID игрока..."
          value={searchQuery}
          onChange={(e) => handleFilterBySearch(e.target.value)}
        />
        {searchQuery !== '' && (
          <button className="admin-reset-filter-button" onClick={handleResetSearch}>
            ✖
          </button>
        )}
      </div>
      
      <div className="admin-users-list">
        <div className="admin-users-count">
          Найдено игроков: {filteredUsers.length} из {users.length}
        </div>
        
        <div className="admin-users-grid">
          {filteredUsers.length === 0 ? (
            <div className="admin-empty-container">
              <div className="admin-empty-text">😕 Игроки не найдены</div>
              <div className="admin-empty-subtext">Попробуйте изменить параметры поиска</div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))
          )}
        </div>
        
        <button className="admin-refresh-button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'ОБНОВЛЕНИЕ...' : '🔄 ОБНОВИТЬ'}
        </button>
      </div>
      
      <CreatePlayerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUsers}
      />
      
      <AddDepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        userId={selectedUser?.id}
        onSuccess={loadUsers}
      />
    </div>
  );
};