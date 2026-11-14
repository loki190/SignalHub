// screens/Strategy.js - веб-версия
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './Strategy.css';

const strategies = [
  {
    id: 1,
    name: 'Sweet Bonanza Super Scatter',
    game: 'Слот',
    action: '🎯 Настройка ставок и прокрутов:\n\n⚙️ Ставка 20 ₽ — 4 прокрута\n⚙️ Ставка 40 ₽ — 5 прокрутов\n⚙️ Ставка 60 ₽ — 4 прокрута\n⚙️ Ставка 80 ₽ — 2 прокрута\n\n🔥 После каждого спина меняйте ставку по схеме!\n',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 2,
    name: 'Gates of Olympus - Dice',
    game: 'Слот',
    action: '🎯 Схема ставок:\n\n⚙️ Ставка 20 ₽ — 3 прокрута\n⚙️ Ставка 40 ₽ — 4 прокрута\n⚙️ Ставка 60 ₽ — 3 прокрута\n⚙️ Ставка 100 ₽ — 2 прокрута\n⚙️ Ставка 80 ₽ — 1 прокрут\n\n⚡ Следите за выпадением множителей x10, x25, x50!\n\n💡 При выпадении множителя x25+ — сделайте максимальную ставку 3 раза.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 3,
    name: 'The Big Dog House',
    game: 'Слот',
    action: '🎯 Прогрессия ставок:\n\n⚙️ Ставка 20 ₽ — 5 прокрутов\n⚙️ Ставка 40 ₽ — 4 прокрута\n⚙️ Ставка 60 ₽ — 3 прокрута\n⚙️ Ставка 80 ₽ — 3 прокрута\n⚙️ Ставка 100 ₽ — 2 прокрута\n\n🐕 Дождитесь появления диких собак на 3+ барабанах!\n💡 При появлении 2+ диких символов — сделайте 3 максимальных спина.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 4,
    name: 'Big Bass Bonanza ',
    game: 'Слот',
    action: '🎯 Настройка прокрутов:\n\n⚙️ Ставка 20 ₽ — 6 прокрутов\n⚙️ Ставка 40 ₽ — 5 прокрутов\n⚙️ Ставка 60 ₽ — 4 прокрута\n⚙️ Ставка 80 ₽ — 3 прокрута\n⚙️ Ставка 100 ₽ — 3 прокрута\n\n🎣 При вылове рыбы с множителем x10 — сделайте 3 спина по максимальной ставке!\n\n💡 Стратегия работает лучше между 20:00 и 02:00.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 5,
    name: 'Starlight Princess - Super Scatter',
    game: 'Слот',
    action: '🎯 Система ставок:\n\n⚙️ Ставка 25 ₽ — 5 прокрутов\n⚙️ Ставка 45 ₽ — 4 прокрута\n⚙️ Ставка 70 ₽ — 3 прокрута\n⚙️ Ставка 95 ₽ — 3 прокрута\n⚙️ Ставка 130 ₽ — 2 прокрута\n\n✨ При принцессе на барабанах — сделайте 2 максимальных спина!\n\n💡 При выпадении 2+ множителей — продолжайте крутить до их активации.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 6,
    name: 'Sugar Rush',
    game: 'Слот',
    action: '🎯 Схема ставок:\n\n⚙️ Ставка 20 ₽ — 5 прокрутов\n⚙️ Ставка 40 ₽ — 4 прокрута\n⚙️ Ставка 60 ₽ — 3 прокрута\n⚙️ Ставка 100 ₽ — 3 прокрута\n\n🍬 При появлении 4+ одинаковых конфет — увеличьте ставку!\n💡 Лучшее время: вечер, 19:00-23:00.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 7,
    name: 'Bonus of Santa',
    game: 'Слот',
    action: '🎯 Cхема ставки \n\n⚙️ Ставка 20 ₽ — 5 прокрутов\n⚙️ Ставка 40 ₽ — 5 прокрута\n⚙️ Ставка 30 ₽ — 5 прокрута\n⚙️ Ставка 50 ₽ — 7 прокрута\n\n🍬 При появлении 4+ одинаковых конфет — увеличьте ставку!\n💡 Лучшее время: вечер, 19:00-23:00',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 8,
    name: 'Money Train 2',
    game: 'Слот',
    action: '🎯 Прогрессия ставок:\n\n⚙️ Ставка 30 ₽ — 5 прокрутов\n⚙️ Ставка 60 ₽ — 4 прокрута\n⚙️ Ставка 90 ₽ — 3 прокрута\n⚙️ Ставка 120 ₽ — 3 прокрута\n\n🚂 При появлении символов с множителями — сделайте 3 спина по максимальной ставке!\n💡 При выпадении 2+ бонусных символов — крутите до активации.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 9,
    name: 'Prince of Dead',
    game: 'Слот',
    action: '🎯 Система ставок:\n\n⚙️ Ставка 20 ₽ — 6 прокрутов\n⚙️ Ставка 40 ₽ — 5 прокрутов\n⚙️ Ставка 60 ₽ — 4 прокрута\n⚙️ Ставка 80 ₽ — 3 прокрута\n\n📖 При выпадении 2+ книг — сделайте 2 максимальных спина!\n💡 Стратегия показывает лучшие результаты при игре на реальные деньги.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 10,
    name: 'Gates of Olympus 1000',
    game: 'Слот',
    action: '🎯 Продвинутая схема:\n\n1️⃣ Ставка 40 ₽ — 4 прокрута\n2️⃣ Ставка 60 ₽ — 4 прокрута\n3️⃣ Ставка 80 ₽ — 3 прокрута\n4️⃣ Ставка 120 ₽ — 3 прокрута\n5️⃣ Ставка 180 ₽ — 2 прокрута\n\n⚡ При выпадении множителя x50+ — сделайте 3 спина по максимальной ставке!\n💡 Лучшее время: 01:00-05:00 по МСК.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 11,
    name: 'Sweet Bonanza 1000',
    game: 'Слот',
    action: '🎯 Агрессивная схема:\n\n⚙️ Ставка 20 ₽ — 5 прокрутов\n⚙️ Ставка 40 ₽ — 4 прокрута\n⚙️ Ставка 60 ₽ — 3 прокрута\n⚙️ Ставка 80 ₽ — 3 прокрута\n\n🍭 При выпадении бонусной игры — удвойте ставку!\n💡 Используйте не более 3 раз подряд.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 12,
    name: 'Wanted Dead or a Wild',
    game: 'Слот',
    action: '🎯 Схема прокрутов:\n\n⚙️ Ставка 50 ₽ — 4 прокрута\n⚙️ Ставка 75 ₽ — 4 прокрута\n⚙️ Ставка 100 ₽ — 3 прокрута\n⚙️ Ставка 150 ₽ — 2 прокрута\n\n🤠 При выпадении Wild на 5 барабанах — сделайте 3 максимальных спина!\n💡 Призовой режим Duel дает лучшие множители.',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 13,
    name: 'Dead or Alive',
    game: 'Слот',
    action: '🎯 Прогрессия ставок:\n\n⚙️ Ставка 40 ₽ — 5 прокрутов\n⚙️ Ставка 60 ₽ — 4 прокрута\n⚙️ Ставка 90 ₽ — 3 прокрута\n⚙️ Ставка 130 ₽ — 3 прокрута\n⚙️ Ставка 180 ₽ — 2 прокрута\n\n💀 При выпадении 3+ скаттеров — продолжайте крутить!\n💡 Лучший бонусный режим: "Поезд" (Train Heist).',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 14,
    name: 'Crown Coins',
    game: 'Слот',
    action: '🎯 Прогрессия ставок:\n\n⚙️ Ставка 40 ₽ — 5 прокрутов\n⚙️ Ставка 30 ₽ — 4 прокрута\n⚙️ Ставка 50 ₽ — 3 прокрута\n⚙️ Ставка 30 ₽ — 3 прокрута\n⚙️ Ставка 20 ₽ — 2 прокрута\n\n',
    difficulty: 'Легкий',
    strategy: 'Слот'
  },
  {
    id: 15,
    name: 'Royal Bags 3',
    game: 'Слот',
    action: '🎯 Прогрессия ставок:\n\n⚙️ Ставка 30 ₽ — 5 прокрутов\n⚙️ Ставка 50 ₽ — 4 прокрута\n⚙️ Ставка 80 ₽ — 3 прокрута\n⚙️ Ставка 120 ₽ — 3 прокрута\n\n',
    difficulty: 'Сложный',
    strategy: 'Слот'
  },
];

const REQUIRED_DEPOSIT = 1000;

export const Strategy = ({ userLevel = 1, playerId = null }) => {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [lockedStrategy, setLockedStrategy] = useState(null);
  const [hasTodayDeposit, setHasTodayDeposit] = useState(true);
  const [checking, setChecking] = useState(true);

  const checkTodayDeposit = async () => {
    console.log("🔍 Проверка депозита для playerId:", playerId);
    
    if (!playerId) {
      console.log("❌ Нет playerId, пропускаем проверку");
      setHasTodayDeposit(true);
      setChecking(false);
      return;
    }
    
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const userId = `player_${playerId}`;
      console.log("📁 Проверяем депозиты для документа:", userId);
      
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
      
      console.log("💰 Депозитов за сегодня:", totalToday);
      console.log("💰 Требуется:", REQUIRED_DEPOSIT);
      
      const hasDeposit = totalToday >= REQUIRED_DEPOSIT;
      setHasTodayDeposit(hasDeposit);
      
      console.log("✅ Результат проверки:", hasDeposit ? "Депозит есть" : "Депозита нет");
      
    } catch (error) {
      console.error("❌ Ошибка проверки депозита:", error);
      setHasTodayDeposit(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkTodayDeposit();
  }, [playerId]);

  const handleStrategyPress = (strategy) => {
    console.log("📱 Нажата стратегия:", strategy.name);
    
    if (strategy.id > userLevel) {
      setLockedStrategy(strategy);
      setShowLockModal(true);
      return;
    }
    
    if (!hasTodayDeposit) {
      setShowDepositModal(true);
      return;
    }
    
    setSelectedStrategy(strategy);
    setShowModal(true);
  };

  const handleDepositLink = () => {
    const url = 'https://click.rioaff4.com/kb3a3wZT?landing=35';
    window.open(url, '_blank');
  };

  const StrategyItem = ({ item }) => {
    const isUnlocked = item.id <= userLevel;
    
    return (
      <button 
        className={`strategy-card ${!isUnlocked ? 'strategy-card-locked' : ''}`}
        onClick={() => handleStrategyPress(item)}
      >
        <div className="strategy-header">
          <div className="strategy-number">
            <span className="strategy-number-text">{item.id}</span>
          </div>
          <div className="strategy-info">
            <div className={`strategy-name ${!isUnlocked ? 'strategy-name-locked' : ''}`}>
              {item.name}
            </div>
            <div className="strategy-tags">
              <span className="strategy-game">{item.game}</span>
            </div>
          </div>
          {!isUnlocked ? (
            <span className="lock-icon">🔒</span>
          ) : (
            <span className="unlock-icon">▶</span>
          )}
        </div>
      </button>
    );
  };

  if (checking) {
    return (
      <div className="strategy-background">
        <div className="strategy-loading-container">
          <div className="strategy-loading-text">Проверка доступа...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="strategy-background">
      <div className="strategy-container">
        <div className="strategy-header-section">
          <div className="strategy-title">✦ СТРАТЕГИИ ДЛЯ СЛОТОВ ✦</div>
          <div className="strategy-level-text">Ваш уровень: {userLevel}</div>
          <div className="strategy-unlocked-text">
            Открыто {Math.min(userLevel, strategies.length)} из {strategies.length} стратегий
          </div>
        </div>

        <div className="strategy-list">
          {strategies.map((item) => (
            <StrategyItem key={item.id} item={item} />
          ))}
        </div>

        <div className="strategy-progress-container">
          <div className="strategy-progress-bar">
            <div 
              className="strategy-progress-fill"
              style={{ width: `${(userLevel / strategies.length) * 100}%` }}
            />
          </div>
          <div className="strategy-progress-text">
            Уровень {userLevel}/{strategies.length}
          </div>
        </div>
      </div>

      {showModal && selectedStrategy && (
        <div className="strategy-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="strategy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="strategy-modal-title">{selectedStrategy.name}</div>
            
            <div className="strategy-modal-tags">
              <span className="strategy-modal-game">{selectedStrategy.game}</span>
            </div>

            <div className="strategy-modal-section">
              <div className="strategy-modal-subtitle">📖 Описание</div>
              <div className="strategy-modal-text">{selectedStrategy.description}</div>
            </div>

            <div className="strategy-modal-section">
              <div className="strategy-modal-subtitle">🎯 Как играть</div>
              <div className="strategy-modal-text strategy-modal-pre">
                {selectedStrategy.action}
              </div>
            </div>

            <div className="strategy-modal-section">
              <div className="strategy-modal-subtitle">🏆 Заработок</div>
              <div className="strategy-modal-text">Потенциальный результат по алгоритму - до 11 500 ₽</div>
            </div>

            <button 
              className="strategy-modal-button"
              onClick={() => setShowModal(false)}
            >
              ПОНЯТНО
            </button>
          </div>
        </div>
      )}

      {showLockModal && lockedStrategy && (
        <div className="strategy-modal-overlay" onClick={() => setShowLockModal(false)}>
          <div className="strategy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="strategy-lock-modal-title">🔒 СТРАТЕГИЯ НЕДОСТУПНА</div>
            
            <div className="strategy-modal-section">
              <div className="strategy-lock-modal-text">
                "{lockedStrategy.name}" требует {lockedStrategy.id} уровня
              </div>
              <div className="strategy-lock-modal-subtext">
                Ваш текущий уровень: {userLevel}
              </div>
            </div>

            <div className="strategy-modal-section">
              <div className="strategy-modal-subtitle">🎯 Как повысить уровень:</div>
              <div className="strategy-modal-info-text">• Пополняйте счет и получайте опыт</div>
              <div className="strategy-modal-info-text">• Играйте в игры и зарабатывайте XP</div>
            </div>

            <div className="strategy-modal-section">
              <div className="strategy-modal-highlight">
                Достигните {lockedStrategy.id} уровня, чтобы открыть эту стратегию!
              </div>
            </div>

            <button 
              className="strategy-modal-button"
              onClick={() => setShowLockModal(false)}
            >
              ПОНЯТНО
            </button>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="strategy-modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="strategy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="strategy-deposit-modal-title">💰 ТРЕБУЕТСЯ ДЕПОЗИТ 💰</div>
            
            <div className="strategy-modal-section">
              <div className="strategy-deposit-modal-text">
                Для заработка по стратегиям необходимо пополнить счет на {REQUIRED_DEPOSIT}₽.
              </div>
              <div className="strategy-deposit-modal-subtext">
                После депозита вы сможете зарабатывать по алгоритмам!
              </div>
            </div>

            <div className="strategy-modal-section">
              <div className="strategy-modal-subtitle">🎯 Необходимость пополнения заключается в:</div>
              <div className="strategy-modal-info-text">• Сброс прошлой игровой статистики</div>
              <div className="strategy-modal-info-text">• Максимальная эффективность алгоритмов</div>
            </div>

            <button 
              className="strategy-deposit-button"
              onClick={handleDepositLink}
            >
              ПЕРЕЙТИ К ПОПОЛНЕНИЮ
            </button>

            <button 
              className="strategy-modal-cancel-button"
              onClick={() => setShowDepositModal(false)}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};