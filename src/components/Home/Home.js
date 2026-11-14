// screens/Home.js - веб-версия (с обновлением раз в час)
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './Home.css';

const userNames = [
  'Александр', 'Дмитрий', 'Максим', 'Артём', 'Иван', 'Кирилл', 'Михаил', 'Егор',
  'Владислав', 'Никита', 'Сергей', 'Андрей', 'Роман', 'Алексей', 'Илья', 'Глеб',
  'Константин', 'Павел', 'Вадим', 'Олег', 'Евгений', 'Валерий', 'Виктор', 'Анатолий',
  'Светлана', 'Анастасия', 'Екатерина', 'Елена', 'Наталья', 'Татьяна',
  'AlexWolff', 'MaxPayne', 'VladKing', 'Nik_Gamer', 'Serega777', 'AndreyPro',
  'RomanBet', 'LexaCasino', 'VladMoney', 'Dimasik', 'Kostyan', 'PashaK'
];

const generateRandomPrize = () => {
  const random = Math.random() * 100;
  
  if (random < 70) {
    return Math.floor(10000 + Math.random() * 10000);
  } else if (random < 85) {
    return Math.floor(20000 + Math.random() * 30000);
  } else if (random < 95) {
    return Math.floor(50000 + Math.random() * 50000);
  } else {
    return Math.floor(100000 + Math.random() * 150000);
  }
};

const getAvatar = (name) => {
  const firstChar = name.charAt(0);
  return firstChar.toUpperCase();
};

const generateWinners = () => {
  const shuffled = [...userNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  const winners = [];
  for (let i = 0; i < 10; i++) {
    winners.push({
      id: i,
      name: shuffled[i % shuffled.length],
      prize: generateRandomPrize(),
      avatar: getAvatar(shuffled[i % shuffled.length])
    });
  }
  return winners.sort((a, b) => b.prize - a.prize);
};

const getTotalXPForLevel = (level) => {
  if (level <= 1) return 0;
  return 500 * (level - 1) * level / 2;
};

const getXPNeededForNextLevel = (level) => {
  return level * 500;
};

const getCurrentLevelProgress = (xp, level) => {
  const totalXPForCurrentLevel = getTotalXPForLevel(level);
  return xp - totalXPForCurrentLevel;
};

const getTimeUntilEndOfMonth = () => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const diff = endOfMonth - now;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
};

export default function Home({ playerId: propPlayerId, onLogout }) {
  const navigate = useNavigate();
  const [topWinners, setTopWinners] = useState([]);
  const [nextUpdate, setNextUpdate] = useState('');
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [playerId, setPlayerId] = useState(propPlayerId);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMonthlyBonusModal, setShowMonthlyBonusModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [monthlyDepositCount, setMonthlyDepositCount] = useState(0);
  const [monthlyStreaks, setMonthlyStreaks] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [giftPulse, setGiftPulse] = useState(false);

  const handlePurchasePress = () => {
    const url = 'https://click.rioaff3.com/kb3a3wZT?landing=35';
    window.open(url, '_blank');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setGiftPulse(true);
      setTimeout(() => setGiftPulse(false), 800);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilEndOfMonth());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }
    
    const docId = `player_${playerId}`;
    console.log("🔄 Подписываемся на документ:", docId);
    setLoading(true);
    
    const userDocRef = doc(db, "users", docId);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        console.log("📊 Данные игрока:", userData);
        setUserLevel(userData.level || 1);
        setUserXP(userData.xp || 0);
        setMonthlyDepositCount(userData.monthlyDeposits || 0);
        setMonthlyStreaks(userData.monthlyStreaks || 0);
        setLoading(false);
      } else {
        console.log("❌ Документ не найден");
        setLoading(false);
      }
    }, (error) => {
      console.error("Ошибка:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [playerId]);

  useEffect(() => {
    const updateWinners = () => {
      const newWinners = generateWinners();
      setTopWinners(newWinners);
      
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const diffMs = nextHour - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffSec = Math.floor((diffMs % 60000) / 1000);
      setNextUpdate(`Обновление через ${diffMin}м ${diffSec}с`);
    };
    
    updateWinners();
    
    const winnersTimer = setInterval(updateWinners, 3600000);
    
    const countdownTimer = setInterval(() => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const diffMs = nextHour - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffSec = Math.floor((diffMs % 60000) / 1000);
      setNextUpdate(`Обновление через ${diffMin}м ${diffSec}с`);
    }, 1000);
    
    return () => {
      clearInterval(winnersTimer);
      clearInterval(countdownTimer);
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const formatNumber = (num) => {
    if (num >= 100000) return (num / 1000).toFixed(0) + 'k';
    return num.toLocaleString();
  };

  const currentProgress = getCurrentLevelProgress(userXP, userLevel);
  const xpNeededForNext = getXPNeededForNextLevel(userLevel);
  const progressPercent = xpNeededForNext > 0 ? (currentProgress / xpNeededForNext) * 100 : 0;

  if (loading) {
    return (
      <div className="home-background">
        <div className="home-loading-container">
          <div className="home-loading-text">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-background">
      <div className="home-container">
        <div className="home-right-buttons">
          <button className="home-side-button home-info-button" onClick={() => setShowInfoModal(true)}>
            i
          </button>
          <button 
            className={`home-side-button home-bonus-button ${giftPulse ? 'pulse' : ''}`}
            onClick={() => setShowMonthlyBonusModal(true)}
          >
            🎁
          </button>
          <button className="home-side-button home-logout-button" onClick={handleLogout}>
            🚪
          </button>
        </div>

        <div className="home-scroll">
          <div className="home-header">
            <div className="home-welcome-text">Добро пожаловать</div>
            {playerId && (
              <div className="home-id-container">
                <span className="home-id-label">ID:</span>
                <span className="home-id-value">{playerId}</span>
              </div>
            )}
          </div>

          <div className="home-circle-container">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" stroke="#8de8ad" strokeWidth="8" fill="none" />
              <text x="60" y="55" textAnchor="middle" fill="#ffd700" fontSize="20" fontWeight="bold">Level</text>
              <text x="60" y="75" textAnchor="middle" fill="#ffd700" fontSize="16" fontWeight="bold">{userLevel}</text>
            </svg>
          </div>

          <div className="home-xp-text-container">
            <div className="home-xp-value">{currentProgress} / {xpNeededForNext} XP</div>
            <div className="home-next-level-text">До {userLevel + 1} уровня (нужно {xpNeededForNext - currentProgress} XP)</div>
          </div>

          <div className="home-linear-progress-container">
            <div className="home-linear-progress-bar">
              <div className="home-linear-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <button className="home-winners-button" onClick={() => setShowWinnersModal(true)}>
            <div className="home-winners-button-title">🏆 ТОП ПОБЕДИТЕЛЕЙ 🏆</div>
            <div className="home-winners-button-subtitle">{nextUpdate}</div>
            <div className="home-winners-button-arrow">▼</div>
          </button>

          <div className="home-premium-container">
            <div className="home-premium-title">🔥 VIP ПРЕДЛОЖЕНИЕ 🔥</div>
            <div className="home-premium-price">2 500 ₽</div>
            <button className="home-upgrade-button" onClick={() => setShowPurchaseModal(true)}>
              КУПИТЬ
            </button>
          </div>
        </div>
      </div>

      {showInfoModal && (
        <div className="home-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="home-modal-title">📈 КАК ПОВЫСИТЬ УРОВЕНЬ 📈</div>
            <div className="home-modal-section">
              <div className="home-modal-subtitle">Повышение уровня:</div>
              <div className="home-modal-info-text">• Каждое пополнение</div>
              <div className="home-modal-info-text">• Игровая активность</div>
            </div>
            <div className="home-modal-section">
              <div className="home-modal-subtitle">📊 Мой прогресс:</div>
              <div className="home-modal-info-text">• Уровень: {userLevel}</div>
              <div className="home-modal-info-text">• Опыт: {currentProgress} / {xpNeededForNext} XP</div>
              <div className="home-modal-info-text">• Всего депозитов: {Math.ceil(userXP / 500)}</div>
            </div>
            <button className="home-modal-button" onClick={() => setShowInfoModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showMonthlyBonusModal && (
        <div className="home-modal-overlay" onClick={() => setShowMonthlyBonusModal(false)}>
          <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="home-modal-title">🎁 ЕЖЕМЕСЯЧНЫЕ БОНУСЫ 🎁</div>
            <div className="home-modal-section">
              <div className="home-modal-subtitle">🏆 Главный приз:</div>
              <div className="home-highlight-text">500 000 ₽</div>
              <div className="home-modal-info-text">• Розыгрыш среди 10 победителей</div>
            </div>
            <div className="home-timer-section">
              <div className="home-timer-title">⏰ ДО РОЗЫГРЫША:</div>
              <div className="home-timer-digits">
                <div className="home-timer-digit-box">
                  <div className="home-timer-digit">{timeRemaining.days}</div>
                  <div className="home-timer-digit-label">дней</div>
                </div>
                <span className="home-timer-separator">:</span>
                <div className="home-timer-digit-box">
                  <div className="home-timer-digit">{timeRemaining.hours}</div>
                  <div className="home-timer-digit-label">часов</div>
                </div>
                <span className="home-timer-separator">:</span>
                <div className="home-timer-digit-box">
                  <div className="home-timer-digit">{timeRemaining.minutes}</div>
                  <div className="home-timer-digit-label">минут</div>
                </div>
                <span className="home-timer-separator">:</span>
                <div className="home-timer-digit-box">
                  <div className="home-timer-digit">{timeRemaining.seconds}</div>
                  <div className="home-timer-digit-label">секунд</div>
                </div>
              </div>
            </div>
            <div className="home-modal-section">
              <div className="home-modal-subtitle">📊 Как увеличить шансы:</div>
              <div className="home-modal-info-text">• Каждые 5 пополнений = +1 стрик</div>
              <div className="home-modal-info-text">• 1 стрик = +5% к шансу победы</div>
            </div>
            <div className="home-modal-section">
              <div className="home-modal-subtitle">⭐ Ваш прогресс:</div>
              <div className="home-progress-bar-container">
                <div className="home-progress-bar-bg">
                  <div className="home-progress-bar-fill" style={{ width: `${(monthlyDepositCount / 30) * 100}%` }} />
                </div>
              </div>
              <div className="home-modal-info-text">• Стриков: {monthlyStreaks} / 6</div>
            </div>
            <button className="home-modal-button" onClick={() => setShowMonthlyBonusModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showWinnersModal && (
        <div className="home-modal-overlay" onClick={() => setShowWinnersModal(false)}>
          <div className="home-modal-content home-winners-modal" onClick={(e) => e.stopPropagation()}>
            <div className="home-modal-title">🏆 ТОП ПОБЕДИТЕЛЕЙ 🏆</div>
            <div className="home-winners-update">{nextUpdate}</div>
            <div className="home-winners-list">
              {topWinners.map((winner, index) => (
                <div key={winner.id} className="home-winner-item">
                  <div className={`home-winner-rank ${index === 0 ? 'home-winner-rank-gold' : ''}`}>
                    <span className="home-winner-rank-text">{index + 1}</span>
                  </div>
                  <div className="home-winner-avatar">
                    <span className="home-winner-avatar-text">{winner.avatar}</span>
                  </div>
                  <div className="home-winner-info">
                    <div className="home-winner-name">{winner.name}</div>
                    <div className="home-winner-prize">+{formatNumber(winner.prize)} ₽</div>
                  </div>
                  <span className="home-winner-crown">
                    {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                  </span>
                </div>
              ))}
            </div>
            <button className="home-strategy-button" onClick={() => { setShowWinnersModal(false); navigate('/strategy'); }}>
              📚 ПЕРЕЙТИ К СТРАТЕГИЯМ
            </button>
            <button className="home-modal-button" onClick={() => setShowWinnersModal(false)}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="home-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="home-modal-content home-purchase-modal" onClick={(e) => e.stopPropagation()}>
            <div className="home-modal-title">🔥 VIP ПРЕДЛОЖЕНИЕ 🔥</div>
            <div className="home-promo-badge">
              <span className="home-promo-badge-text">-50% СЕГОДНЯ</span>
            </div>
            <div className="home-purchase-price-container">
              <div className="home-old-price">5 000 ₽</div>
              <div className="home-purchase-price">2 500 ₽</div>
            </div>
            <div className="home-divider"></div>
            <div className="home-purchase-desc">🔥 Что вы получите:</div>
            <div className="home-purchase-list">
              <div className="home-purchase-item">
                <span className="home-purchase-check">✅</span>
                <span className="home-purchase-item-text">Эксклюзивные стратегии на слоты</span>
              </div>
              <div className="home-purchase-item">
                <span className="home-purchase-check">✅</span>
                <span className="home-purchase-item-text">Стратегии на LIVE-игры</span>
              </div>
            </div>
            <div className="home-divider"></div>
            <div className="home-purchase-buttons">
              <button className="home-modal-button home-purchase-cancel" onClick={() => setShowPurchaseModal(false)}>ОТМЕНА</button>
              <button className="home-modal-button home-purchase-confirm" onClick={handlePurchasePress}>КУПИТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}