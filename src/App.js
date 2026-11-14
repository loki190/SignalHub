import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { Login } from './components/Login/Login';
import Home from './components/Home/Home';
import { Strategy } from './components/Strategy/Strategy';
import { Roulette } from './components/Roulette/Roulette';
import { Aviator } from './components/Aviator/Aviator';
import { AdminPanel } from './AdminPanel';
import './App.css';

function Navigation({ userLevel, userTotalDeposit, playerId, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const tabs = [
    { name: 'Home', label: 'ДОМОЙ', icon: '🏠', path: '/' },
    { name: 'Strategy', label: 'СТРАТЕГИЯ', icon: '📊', path: '/strategy' },
    { name: 'Aviator', label: 'AVIATOR', icon: '✈️', path: '/aviator' },
    { name: 'Roulette', label: 'РУЛЕТКА', icon: '🎲', path: '/roulette' },
  ];

  const currentPath = location.pathname;

  return (
    <div className={isMobile ? 'app-container-mobile' : 'app-container-desktop'}>
      <div className={isMobile ? 'app-content-mobile' : 'app-content-desktop'}>
        <Routes>
          <Route path="/" element={<Home playerId={playerId} onLogout={onLogout} />} />
          <Route path="/strategy" element={<Strategy userLevel={userLevel} playerId={playerId} />} />
          <Route path="/aviator" element={<Aviator userLevel={userLevel} />} />
          <Route path="/roulette" element={<Roulette userLevel={userLevel} userTotalDeposit={userTotalDeposit} playerId={playerId} />} />
        </Routes>
      </div>

      {isMobile ? (
        <div className="bottom-nav-mobile">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`nav-item-mobile ${currentPath === tab.path ? 'active-mobile' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="nav-icon-mobile">{tab.icon}</span>
              <span className="nav-label-mobile">{tab.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="side-nav-desktop">
          <div className="side-nav-header">
            <h2>🎰 SIGNAL HUB</h2>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`nav-item-desktop ${currentPath === tab.path ? 'active-desktop' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="nav-icon-desktop">{tab.icon}</span>
              <span className="nav-label-desktop">{tab.label}</span>
            </button>
          ))}
          <button className="logout-btn-desktop" onClick={onLogout}>
            <span>🚪</span>
            <span>ВЫЙТИ</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const storedRole = localStorage.getItem(`user_role_${firebaseUser.uid}`);
        const storedData = localStorage.getItem(`user_data_${firebaseUser.uid}`);
        
        if (storedRole && storedData) {
          setUser(firebaseUser);
          setUserRole(storedRole);
          setUserData(JSON.parse(storedData));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userInfo) => {
    setUser(userInfo.user);
    setUserRole(userInfo.role);
    setUserData(userInfo.userData);
    
    if (userInfo.user && userInfo.user.uid) {
      localStorage.setItem(`user_role_${userInfo.user.uid}`, userInfo.role);
      localStorage.setItem(`user_data_${userInfo.user.uid}`, JSON.stringify(userInfo.userData));
    }
  };

  const handleLogout = async () => {
    if (user && user.uid) {
      localStorage.removeItem(`user_role_${user.uid}`);
      localStorage.removeItem(`user_data_${user.uid}`);
    }
    setUser(null);
    setUserRole(null);
    setUserData(null);
    await auth.signOut().catch(console.error);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div>Загрузка...</div>
      </div>
    );
  }

  if (user && userRole === 'admin') {
    return (
      <div className="admin-container">
        <AdminPanel onLogout={handleLogout} />
      </div>
    );
  }

  if (user && userRole === 'player') {
    return (
      <BrowserRouter>
        <Navigation 
          userLevel={userData?.level || 1} 
          userTotalDeposit={userData?.totalDeposit || 0}
          playerId={user?.playerId || userData?.playerId}
          onLogout={handleLogout}
        />
      </BrowserRouter>
    );
  }

  return (
    <div className="login-container">
      <Login onLogin={handleLogin} />
    </div>
  );
}