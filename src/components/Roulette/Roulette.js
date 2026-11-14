// screens/Roulette.js - веб-версия (точная остановка по центру сектора)
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import './Roulette.css';

const rouletteNumbers = [
  { number: 0, color: '#2ecc71', textColor: 'Зеленый', position: 0 },
  { number: 32, color: '#e74c3c', textColor: 'Красный', position: 1 }, 
  { number: 15, color: '#2c3e50', textColor: 'Черный', position: 2 },
  { number: 19, color: '#e74c3c', textColor: 'Красный', position: 3 }, 
  { number: 4, color: '#2c3e50', textColor: 'Черный', position: 4 },
  { number: 21, color: '#e74c3c', textColor: 'Красный', position: 5 }, 
  { number: 2, color: '#2c3e50', textColor: 'Черный', position: 6 },
  { number: 25, color: '#e74c3c', textColor: 'Красный', position: 7 }, 
  { number: 17, color: '#2c3e50', textColor: 'Черный', position: 8 },
  { number: 34, color: '#e74c3c', textColor: 'Красный', position: 9 }, 
  { number: 6, color: '#2c3e50', textColor: 'Черный', position: 10 },
  { number: 27, color: '#e74c3c', textColor: 'Красный', position: 11 }, 
  { number: 13, color: '#2c3e50', textColor: 'Черный', position: 12 },
  { number: 36, color: '#e74c3c', textColor: 'Красный', position: 13 }, 
  { number: 11, color: '#2c3e50', textColor: 'Черный', position: 14 },
  { number: 30, color: '#e74c3c', textColor: 'Красный', position: 15 }, 
  { number: 8, color: '#2c3e50', textColor: 'Черный', position: 16 },
  { number: 23, color: '#e74c3c', textColor: 'Красный', position: 17 }, 
  { number: 10, color: '#2c3e50', textColor: 'Черный', position: 18 },
  { number: 5, color: '#e74c3c', textColor: 'Красный', position: 19 }, 
  { number: 24, color: '#2c3e50', textColor: 'Черный', position: 20 },
  { number: 16, color: '#e74c3c', textColor: 'Красный', position: 21 }, 
  { number: 33, color: '#2c3e50', textColor: 'Черный', position: 22 },
  { number: 1, color: '#e74c3c', textColor: 'Красный', position: 23 }, 
  { number: 20, color: '#2c3e50', textColor: 'Черный', position: 24 },
  { number: 14, color: '#e74c3c', textColor: 'Красный', position: 25 }, 
  { number: 31, color: '#2c3e50', textColor: 'Черный', position: 26 },
  { number: 9, color: '#e74c3c', textColor: 'Красный', position: 27 }, 
  { number: 22, color: '#2c3e50', textColor: 'Черный', position: 28 },
  { number: 18, color: '#e74c3c', textColor: 'Красный', position: 29 }, 
  { number: 29, color: '#2c3e50', textColor: 'Черный', position: 30 },
  { number: 7, color: '#e74c3c', textColor: 'Красный', position: 31 }, 
  { number: 28, color: '#2c3e50', textColor: 'Черный', position: 32 },
  { number: 12, color: '#e74c3c', textColor: 'Красный', position: 33 }, 
  { number: 35, color: '#2c3e50', textColor: 'Черный', position: 34 },
  { number: 3, color: '#e74c3c', textColor: 'Красный', position: 35 }, 
  { number: 26, color: '#2c3e50', textColor: 'Черный', position: 36 },
];

const getNumberColor = (number) => {
  if (number === 0) return 'Зеленый';
  const numObj = rouletteNumbers.find(item => item.number === number);
  return numObj ? numObj.textColor : (number % 2 === 0 ? 'Черный' : 'Красный');
};

const prizesList = [
  { name: 'iPhone 17 Pro Max', icon: '🏆', available: false },
  { name: 'MacBook Pro M4', icon: '💻', available: false },
  { name: 'AirPods Pro 3', icon: '🎧', available: false },
  { name: '20% Скидка на Стратегии', icon: '📖', available: true, code: 'CASINO20' },
];

const prizes = [
  { name: 'iPhone 17 Pro Max', value: 'iphone'},
  { name: 'MacBook Pro M4', value: 'macbook'},
  { name: 'AirPods Pro 3', value: 'airpods'},
  { name: '20% Скидка на Стратегии', value: 'discount', probability: 0.35, code: 'CASINO20' },
  { name: 'Повезет в следующий раз', value: 'empty', probability: 0.65 },
];

const MAX_SPINS_PER_DAY = 5;
const REQUIRED_LEVEL = 5;
const REQUIRED_DEPOSIT = 1000;

export const Roulette = ({ userLevel = 1, userTotalDeposit = 0, playerId: propPlayerId }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [finalNumber, setFinalNumber] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showNoSpinsModal, setShowNoSpinsModal] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(MAX_SPINS_PER_DAY);
  const [isAvailable, setIsAvailable] = useState(false);
  const [history, setHistory] = useState([]);
  const [hasLevelAccess, setHasLevelAccess] = useState(true);
  const [hasTodayDeposit, setHasTodayDeposit] = useState(false);
  const [isAllowedDay, setIsAllowedDay] = useState(false);
  const [todaysDepositAmount, setTodaysDepositAmount] = useState(0);
  const [playerId, setPlayerId] = useState(propPlayerId);
  const [isChecking, setIsChecking] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [wheelSize, setWheelSize] = useState(360);
  const wheelRef = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      const newSize = Math.min(window.innerWidth - 60, 420);
      setWheelSize(newSize);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const checkDay = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const allowed = (dayOfWeek === 1 || dayOfWeek === 4);
    setIsAllowedDay(allowed);
    return allowed;
  };

  const checkTodayDepositsByPlayerId = async (pId) => {
    if (!pId) return false;
    
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const userId = `player_${pId}`;
      
      const depositsQuery = query(
        collection(db, "users", userId, "deposits"),
        where("date", ">=", todayStart.toISOString()),
        where("date", "<", todayEnd.toISOString())
      );
      
      const depositsSnapshot = await getDocs(depositsQuery);
      let totalToday = 0;
      
      depositsSnapshot.forEach((doc) => {
        const depositData = doc.data();
        totalToday += depositData.amount || 0;
      });
      
      setTodaysDepositAmount(totalToday);
      const hasDeposit = totalToday >= REQUIRED_DEPOSIT;
      setHasTodayDeposit(hasDeposit);
      
      return hasDeposit;
    } catch (error) {
      console.error("Ошибка проверки депозитов:", error);
      return false;
    }
  };

  const checkAccess = async () => {
    setIsChecking(true);
    
    if (userLevel < REQUIRED_LEVEL) {
      setHasLevelAccess(false);
      setShowLevelModal(true);
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }
    setHasLevelAccess(true);
    setShowLevelModal(false);
    
    const isDayAllowed = checkDay();
    if (!isDayAllowed) {
      setShowDayModal(true);
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }
    setShowDayModal(false);
    
    if (!playerId) {
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }
    
    const hasDeposit = await checkTodayDepositsByPlayerId(playerId);
    
    if (!hasDeposit) {
      setShowDepositModal(true);
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }
    setShowDepositModal(false);
    
    await checkAvailability();
    setIsChecking(false);
  };

  const checkAvailability = async () => {
    if (!playerId) return;
    
    const today = new Date().toDateString();
    const storageKey = `roulette_spins_${playerId}`;
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : { date: '', count: 0 };
    
    if (data.date !== today) {
      localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 0 }));
      setSpinsLeft(MAX_SPINS_PER_DAY);
      setIsAvailable(true);
      loadHistory();
    } else {
      const remaining = MAX_SPINS_PER_DAY - data.count;
      setSpinsLeft(remaining);
      setIsAvailable(remaining > 0);
      if (remaining <= 0) {
        setShowNoSpinsModal(true);
      }
    }
  };

  useEffect(() => {
    if (!playerId) return;
    
    const userId = `player_${playerId}`;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const depositsQuery = query(
      collection(db, "users", userId, "deposits"),
      where("date", ">=", todayStart.toISOString())
    );
    
    const unsubscribe = onSnapshot(depositsQuery, async (snapshot) => {
      let totalToday = 0;
      snapshot.forEach((doc) => {
        const depositData = doc.data();
        totalToday += depositData.amount || 0;
      });
      
      setTodaysDepositAmount(totalToday);
      const hasDeposit = totalToday >= REQUIRED_DEPOSIT;
      setHasTodayDeposit(hasDeposit);
      
      const isDayAllowed = checkDay();
      if (hasDeposit && userLevel >= REQUIRED_LEVEL && isDayAllowed) {
        setShowDepositModal(false);
        await checkAvailability();
      } else if (!hasDeposit && userLevel >= REQUIRED_LEVEL && isDayAllowed) {
        setShowDepositModal(true);
        setIsAvailable(false);
      }
    });
    
    return () => unsubscribe();
  }, [playerId, userLevel]);

  const loadHistory = () => {
    try {
      if (!playerId) return;
      const storageKey = `roulette_history_${playerId}`;
      const storedHistory = localStorage.getItem(storageKey);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = (spinData) => {
    try {
      if (!playerId) return;
      const storageKey = `roulette_history_${playerId}`;
      const newHistory = [spinData, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const consumeSpin = () => {
    if (spinsLeft <= 0) {
      setIsAvailable(false);
      setShowNoSpinsModal(true);
      return false;
    }
    
    if (!playerId) return false;
    
    const today = new Date().toDateString();
    const storageKey = `roulette_spins_${playerId}`;
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : { date: today, count: 0 };
    const newCount = data.count + 1;
    localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
    setSpinsLeft(MAX_SPINS_PER_DAY - newCount);
    
    if (newCount >= MAX_SPINS_PER_DAY) {
      setIsAvailable(false);
    }
    return true;
  };

  useEffect(() => {
    if (playerId) {
      checkAccess();
    }
  }, [playerId, userLevel]);

  const getRandomPrize = () => {
    const random = Math.random();
    let cumulative = 0;
    for (const prize of prizes) {
      if (prize.probability) {
        cumulative += prize.probability;
        if (random <= cumulative) {
          return prize;
        }
      }
    }
    return prizes.find(p => p.value === 'empty') || prizes[prizes.length - 1];
  };

  const debugWinner = () => {
    if (!wheelRef.current) {
      console.log('❌ Колесо не найдено');
      return null;
    }
    
    const anglePerSegment = 360 / rouletteNumbers.length;
    const currentRotationDeg = rotation % 360;
    let segmentIndex = Math.floor(((90 - currentRotationDeg + 360) % 360) / anglePerSegment);
    segmentIndex = (segmentIndex + rouletteNumbers.length) % rouletteNumbers.length;
    const winnerNumber = rouletteNumbers[segmentIndex].number;
    
    console.log(`🔍 Текущий выигрышный номер: ${winnerNumber}`);
    return winnerNumber;
  };

  useEffect(() => {
    window.debugRoulette = debugWinner;
  }, [rotation]);

  const spinWheel = async () => {
    if (isSpinning) return;
    
    if (userLevel < REQUIRED_LEVEL) {
      setShowLevelModal(true);
      return;
    }
    
    if (!isAllowedDay) {
      setShowDayModal(true);
      return;
    }
    
    if (!hasTodayDeposit) {
      setShowDepositModal(true);
      return;
    }
    
    if (!isAvailable) {
      setShowNoSpinsModal(true);
      return;
    }
    
    const canSpin = consumeSpin();
    if (!canSpin) return;
    
    setIsSpinning(true);
    setResult(null);
    setShowResultModal(false);

    const prize = getRandomPrize();
    const anglePerSegment = 360 / rouletteNumbers.length;
    
    const randomIndex = Math.floor(Math.random() * rouletteNumbers.length);
    const targetNumber = rouletteNumbers[randomIndex].number;
    
    const sectorCenter = randomIndex * anglePerSegment + anglePerSegment / 2;
    
    let targetRotation = (90 - sectorCenter + 360) % 360;
    let currentRotationMod = rotation % 360;
    
    const minSpins = 8;
    const maxSpins = 15;
    const fullSpins = Math.floor(minSpins + Math.random() * (maxSpins - minSpins));
    const totalFullSpinDegrees = fullSpins * 360;
    
    let delta = (targetRotation - currentRotationMod + 360) % 360;
    let finalRotationValue = rotation + totalFullSpinDegrees + delta;
    
    console.log('=== ВРАЩЕНИЕ РУЛЕТКИ ===');
    console.log(`🎲 Выпал номер: ${targetNumber}`);
    console.log(`🎯 Центр сектора: ${sectorCenter}°`);
    console.log(`🏁 Финальный угол: ${finalRotationValue % 360}°`);
    
    setRotation(finalRotationValue);
    
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 3.5s cubic-bezier(0.23, 1, 0.32, 1)';
      wheelRef.current.style.transform = `rotate(${finalRotationValue}deg)`;
      
      setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'none';
          const normalizedRotation = finalRotationValue % 360;
          wheelRef.current.style.transform = `rotate(${normalizedRotation}deg)`;
          setRotation(normalizedRotation);
        }
        
        const spinRecord = {
          id: Date.now(),
          number: targetNumber,
          color: getNumberColor(targetNumber),
          prize: prize.value === 'empty' ? 'Нет приза' : prize.name,
          timestamp: new Date().toLocaleString('ru-RU'),
        };
        saveToHistory(spinRecord);
        
        setResult(targetNumber);
        setFinalNumber(targetNumber);
        setWonPrize(prize);
        setShowResultModal(true);
        setIsSpinning(false);
      }, 3500);
    }
  };

  const closeModal = () => {
    setShowResultModal(false);
  };

  const renderWheelSVG = () => {
    const center = wheelSize / 2;
    const radius = wheelSize / 2;
    const anglePerSegment = 360 / rouletteNumbers.length;
    
    return (
      <svg 
        ref={wheelRef}
        width={wheelSize} 
        height={wheelSize} 
        viewBox={`0 0 ${wheelSize} ${wheelSize}`}
        style={{ transform: `rotate(${rotation}deg)`, transition: 'none' }}
      >
        {rouletteNumbers.map((item, index) => {
          const startAngle = index * anglePerSegment;
          const endAngle = startAngle + anglePerSegment;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          const x1 = center + radius * Math.cos(startRad);
          const y1 = center + radius * Math.sin(startRad);
          const x2 = center + radius * Math.cos(endRad);
          const y2 = center + radius * Math.sin(endRad);
          
          const largeArc = anglePerSegment > 180 ? 1 : 0;
          const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          
          const textAngle = startAngle + anglePerSegment / 2;
          const textRad = (textAngle * Math.PI) / 180;
          const textRadius = radius * 0.85;
          const textX = center + textRadius * Math.cos(textRad);
          const textY = center + textRadius * Math.sin(textRad);
          
          return (
            <g key={index}>
              <path d={pathData} fill={item.color} stroke="#ffd700" strokeWidth="2" />
              <text 
                x={textX} 
                y={textY} 
                fill="white" 
                fontSize={wheelSize > 350 ? 14 : 12} 
                fontWeight="bold" 
                textAnchor="middle"
                dominantBaseline="middle"
                stroke="#1a1a1a"
                strokeWidth="0.5"
                paintOrder="stroke"
                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
              >
                {item.number}
              </text>
            </g>
          );
        })}
        <circle cx={center} cy={center} r={center * 0.19} fill="#ffd700" stroke="#1a1a1a" strokeWidth="3" />
        <circle cx={center} cy={center} r={center * 0.07} fill="#1a1a1a" />
      </svg>
    );
  };

  const HistoryItem = ({ item }) => {
    let colorClass = '';
    if (item.color === 'Красный') colorClass = 'roulette-history-red';
    else if (item.color === 'Черный') colorClass = 'roulette-history-black';
    else colorClass = 'roulette-history-green';
    
    const isWin = item.prize !== 'Нет приза';
    
    return (
      <div className="roulette-history-item">
        <span className="roulette-history-time">{item.timestamp}</span>
        <span className={`roulette-history-number ${colorClass}`}>{item.number}</span>
        <span className={`roulette-history-prize ${isWin ? 'roulette-history-win' : ''}`}>
          {item.prize}
        </span>
      </div>
    );
  };

  const addTestSpins = () => {
    if (!playerId) {
      alert("Нет playerId");
      return;
    }
    
    const today = new Date().toDateString();
    const storageKey = `roulette_spins_${playerId}`;
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : { date: today, count: 0 };
    
    const newCount = Math.max(0, data.count - 5);
    localStorage.setItem(storageKey, JSON.stringify({ date: today, count: newCount }));
    
    const remaining = MAX_SPINS_PER_DAY - newCount;
    setSpinsLeft(remaining);
    setIsAvailable(remaining > 0);
    
    alert(`✅ Добавлено 5 спинов! Осталось: ${remaining}`);
  };

  if (isChecking) {
    return (
      <div className="roulette-background">
        <div className="roulette-loading-container">
          <div className="roulette-loading-text">Проверка доступа...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="roulette-background">
      <div className="roulette-container">
        <button className="roulette-info-button" onClick={() => setShowInfoModal(true)}>i</button>
        <button className="roulette-history-button" onClick={() => setShowHistoryModal(true)}>📜</button>

        {/* Тестовая кнопка для добавления спинов 
        <button 
          onClick={addTestSpins}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            background: '#ff4444',
            color: 'white',
            border: '2px solid #ffd700',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          +5<br/>спинов
        </button>
*/}
        <div className="roulette-title-container">
          <div className="roulette-title">РУЛЕТКА</div>
        </div>

        <div className="roulette-wheel-wrapper">
          <div className="roulette-wheel-container">
            {renderWheelSVG()}
          </div>
          <div className="roulette-pointer">
            <div className="roulette-pointer-top" />
          </div>
        </div>

        <button 
          className={`roulette-spin-button ${(isSpinning || !isAvailable || !hasLevelAccess || !isAllowedDay || !hasTodayDeposit) ? 'roulette-spin-button-disabled' : ''}`}
          onClick={spinWheel}
          disabled={isSpinning || !isAvailable || !hasLevelAccess || !isAllowedDay || !hasTodayDeposit}
        >
          {isSpinning ? 'ВРАЩЕНИЕ...' : 'КРУТИТЬ'}
        </button>

        {result && !isSpinning && hasLevelAccess && isAllowedDay && hasTodayDeposit && (
          <div className="roulette-result-container">
            <div className="roulette-result-label">ПОСЛЕДНИЙ РЕЗУЛЬТАТ</div>
            <div className="roulette-result-number">{result}</div>
          </div>
        )}

        <div className="roulette-prizes-container">
          <div className="roulette-prizes-title">🎁 ПРИЗЫ 🎁</div>
          <div className="roulette-prizes-list">
            {prizesList.map((prize, idx) => (
              <span key={idx} className="roulette-prize-item">
                {prize.icon} {prize.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showLevelModal && (
        <div className="roulette-modal-overlay" onClick={() => setShowLevelModal(false)}>
          <div className="roulette-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">🔒 ТРЕБУЕТСЯ УРОВЕНЬ 🔒</div>
            <div className="roulette-modal-section">
              <div className="roulette-level-modal-text">Рулетка доступна игрокам с {REQUIRED_LEVEL} уровнем и выше.</div>
              <div className="roulette-level-modal-subtext">Ваш текущий уровень: {userLevel}</div>
            </div>
            <div className="roulette-modal-section">
              <div className="roulette-modal-subtitle">🎁 Доступные призы:</div>
              <div className="roulette-modal-text">🏆 iPhone 17 Pro Max</div>
              <div className="roulette-modal-text">💻 MacBook Pro M4</div>
              <div className="roulette-modal-text">🎧 AirPods Pro 3</div>
              <div className="roulette-modal-text">📖 20% Скидка на Стратегии</div>
            </div>
            <button className="roulette-modal-button" onClick={() => setShowLevelModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showDayModal && (
        <div className="roulette-modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="roulette-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">📅 РУЛЕТКА НЕДОСТУПНА 📅</div>
            <div className="roulette-modal-section">
              <div className="roulette-day-modal-text">Рулетка доступна только по понедельникам и четвергам.</div>
              <div className="roulette-day-modal-subtext">Загляните в один из этих дней, чтобы испытать удачу!</div>
            </div>
            <button className="roulette-modal-button" onClick={() => setShowDayModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="roulette-modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="roulette-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">💰 ТРЕБУЕТСЯ ДЕПОЗИТ 💰</div>
            <div className="roulette-modal-section">
              <div className="roulette-deposit-modal-text">Для игры в рулетку сегодня необходимо пополнить счет на {REQUIRED_DEPOSIT}₽.</div>
              <div className="roulette-deposit-modal-subtext">Пополнено сегодня: {todaysDepositAmount}₽ из {REQUIRED_DEPOSIT}₽</div>
            </div>
            <button className="roulette-modal-button" onClick={() => setShowDepositModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showNoSpinsModal && (
        <div className="roulette-modal-overlay" onClick={() => setShowNoSpinsModal(false)}>
          <div className="roulette-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">🎲 СПИНЫ ЗАКОНЧИЛИСЬ 🎲</div>
            <div className="roulette-modal-section">
              <div className="roulette-no-spins-modal-text">Вы использовали все {MAX_SPINS_PER_DAY} спинов на сегодня.</div>
              <div className="roulette-no-spins-modal-subtext">Возвращайтесь завтра, чтобы получить новые спины!</div>
            </div>
            <button className="roulette-modal-button" onClick={() => setShowNoSpinsModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="roulette-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="roulette-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">КАК ИГРАТЬ</div>
            <div className="roulette-modal-section">
              <div className="roulette-modal-subtitle">📅 Доступные дни:</div>
              <div className="roulette-modal-text">• Понедельник и Четверг</div>
              <div className="roulette-modal-text">• {MAX_SPINS_PER_DAY} вращений в день</div>
            </div>
            <div className="roulette-modal-section">
              <div className="roulette-modal-subtitle">💰 Требования:</div>
              <div className="roulette-modal-text">• Уровень {REQUIRED_LEVEL}+</div>
              <div className="roulette-modal-text">• Пополнить от {REQUIRED_DEPOSIT}₽ в день игры</div>
            </div>
            <div className="roulette-modal-section">
              <div className="roulette-modal-subtitle">🎲 Правила игры:</div>
              <div className="roulette-modal-text">1. Нажмите КРУТИТЬ, чтобы запустить рулетку</div>
              <div className="roulette-modal-text">2. Смотрите за вращением колеса</div>
              <div className="roulette-modal-text">3. Выигрывайте крутые призы!</div>
            </div>
            <button className="roulette-modal-button" onClick={() => setShowInfoModal(false)}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="roulette-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="roulette-modal-content roulette-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">📜 ИСТОРИЯ ВРАЩЕНИЙ 📜</div>
            {history.length === 0 ? (
              <div className="roulette-empty-history">
                <div className="roulette-empty-history-text">Пока нет вращений!</div>
                <div className="roulette-empty-history-subtext">Сделайте первый спин, чтобы увидеть историю</div>
              </div>
            ) : (
              <div className="roulette-history-list">
                {history.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            )}
            <button className="roulette-modal-button" onClick={() => setShowHistoryModal(false)}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}

      {showResultModal && wonPrize && (
        <div className="roulette-modal-overlay" onClick={closeModal}>
          <div className="roulette-modal-content roulette-result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="roulette-modal-title">🎲 РЕЗУЛЬТАТ 🎲</div>
            <div className="roulette-modal-number">{finalNumber}</div>
            <div className={`roulette-modal-number-desc ${
              getNumberColor(finalNumber) === 'Красный' ? 'roulette-red-text' : 
              (getNumberColor(finalNumber) === 'Зеленый' ? 'roulette-green-text' : 'roulette-black-text')
            }`}>
              {getNumberColor(finalNumber) === 'Зеленый' ? 'Зеленый ноль!' : `${getNumberColor(finalNumber)}!`}
            </div>
            <div className="roulette-divider"></div>
            {wonPrize.value === 'empty' ? (
              <>
                <div className="roulette-modal-empty-text">😔 Нет приза в этот раз</div>
                <div className="roulette-modal-empty-subtext">Осталось спинов: {spinsLeft}</div>
              </>
            ) : wonPrize.value === 'discount' ? (
              <>
                <div className="roulette-modal-prize-name">🏆 Вы выиграли: {wonPrize.name}!</div>
                <div className="roulette-discount-code">
                  <div className="roulette-discount-label">Ваш промокод:</div>
                  <div className="roulette-discount-code-text">CASINO20</div>
                  <div className="roulette-discount-info">20% скидка в разделе Стратегии!</div>
                </div>
              </>
            ) : (
              <>
                <div className="roulette-modal-jackpot-name">✨ Вы выиграли: {wonPrize.name}! ✨</div>
                <div className="roulette-modal-message">Свяжитесь с поддержкой для получения приза!</div>
              </>
            )}
            <button className="roulette-modal-button" onClick={closeModal}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
    </div>
  );
};