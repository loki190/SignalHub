// screens/Login.js - с невидимым двойным кликом для админа
import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';

const PremiumAlert = ({ visible, title, message, onClose, isSuccess = true }) => {
  if (!visible) return null;
  
  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-container" onClick={(e) => e.stopPropagation()}>
        <div className="icon-circle">
          <span className="icon-text">{isSuccess ? '✓' : '!'}</span>
        </div>
        <div className="alert-title">{title}</div>
        <div className="decorative-line">
          <div className="decorative-dot" />
          <div className="decorative-dot" />
          <div className="decorative-dot" />
        </div>
        <div className="alert-message">{message}</div>
        <button className="alert-button" onClick={onClose}>
          <span className="alert-button-text">ПРОДОЛЖИТЬ</span>
          <span className="alert-button-icon">→</span>
        </button>
      </div>
    </div>
  );
};

const SecretAdminModal = ({ visible, onClose, onLogin, showError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Ошибка', 'Пожалуйста, введите email и пароль');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        showError('Ошибка входа', 'У вас нет прав администратора');
        setLoading(false);
        return;
      }
      
      if (onLogin) {
        onLogin({ user, role: "admin", userData: userDoc.data() });
      }
      
      onClose();
      setEmail('');
      setPassword('');
      
    } catch (error) {
      console.error('Login error:', error);
      showError('Ошибка входа', 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🔐 ДОСТУП АДМИНИСТРАТОРА</div>
        <div className="modal-input-wrapper">
          <span className="modal-input-icon">@</span>
          <input 
            type="email"
            className="modal-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-input-wrapper">
          <span className="modal-input-icon">●</span>
          <input 
            type="password"
            className="modal-input"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="modal-buttons">
          <button className="modal-button modal-cancel-button" onClick={onClose}>ОТМЕНА</button>
          <button className="modal-button modal-save-button" onClick={handleLogin} disabled={loading}>
            {loading ? 'ВХОД...' : 'ВОЙТИ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Login = ({ onLogin }) => {
  const [playerId, setPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', isSuccess: true });

  const showPremiumAlert = (title, message, isSuccess = true) => {
    setAlertData({ title, message, isSuccess });
    setAlertVisible(true);
  };

  const handlePlayerLogin = async () => {
    if (!playerId.trim()) {
      showPremiumAlert('Ошибка', 'Пожалуйста, введите ваш ID аккаунта');
      return;
    }
    
    setLoading(true);
    try {
      const userId = `player_${playerId.trim()}`;
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (!userDoc.exists()) {
        showPremiumAlert('Ошибка входа', 'Пользователь с таким ID не найден. Обратитесь к администратору.');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData.role !== 'player') {
        showPremiumAlert('Ошибка входа', 'Данный ID не является игровым аккаунтом.');
        setLoading(false);
        return;
      }
      
      const user = { uid: userId, playerId: playerId.trim() };
      
      if (onLogin) {
        onLogin({ user, role: "player", userData });
      }
      
      setPlayerId('');
      
    } catch (error) {
      console.error('Login error:', error);
      showPremiumAlert('Ошибка входа', 'Не удалось войти в аккаунт.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDoubleClick = () => {
    setAdminModalVisible(true);
  };

  return (
    <>
      <div className="login-page">
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-logo">
              <h1 className="login-title">SIGNAL HUB</h1>
              <p className="login-subtitle">ACCURATE SIGNAL. REAL RESULT.</p>
            </div>

            <div className="login-form">
              <div className="input-group">
                <span className="input-emoji">🎮</span>
                <input 
                  type="text"
                  className="login-input-field"
                  placeholder="Введите ваш ID аккаунта"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePlayerLogin()}
                  autoFocus={true}
                />
              </div>
              
              <button 
                className={`login-btn ${loading ? 'login-btn-disabled' : ''}`}
                onClick={handlePlayerLogin}
                disabled={loading}
              >
                {loading ? 'ПРОВЕРКА...' : 'ВОЙТИ'}
              </button>
              
              <p className="login-hint">
                Введите ваш ID, полученный у администратора
              </p>
            </div>

            <div 
              className="admin-secret-area"
              onDoubleClick={handleAdminDoubleClick}
            />
          </div>
        </div>
      </div>

      <SecretAdminModal
        visible={adminModalVisible}
        onClose={() => setAdminModalVisible(false)}
        onLogin={onLogin}
        showError={showPremiumAlert}
      />

      <PremiumAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        isSuccess={alertData.isSuccess}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
};