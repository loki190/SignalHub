// screens/Aviator.js - веб-версия
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Aviator.css';

const REQUIRED_LEVEL = 10;

const generateCoefficient = () => {
  const random = Math.random() * 100;
  
  if (random < 70) {
    return (1.5 + Math.random() * 3.5).toFixed(2);
  } else if (random < 85) {
    return (5 + Math.random() * 5).toFixed(2);
  } else if (random < 95) {
    return (10 + Math.random() * 10).toFixed(2);
  } else {
    return (20 + Math.random() * 30).toFixed(2);
  }
};

export const Aviator = ({ userLevel = 1 }) => {
  const navigate = useNavigate();
  const [isCharging, setIsCharging] = useState(false);
  const [coefficient, setCoefficient] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [hasLevelAccess, setHasLevelAccess] = useState(true);
  const [progress, setProgress] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  
  const progressInterval = useRef(null);
  const pulseInterval = useRef(null);

  useEffect(() => {
    checkLevelAccess();
    startPulse();
    setTimeout(() => {
      setShowPromoModal(true);
    }, 500);
    
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (pulseInterval.current) clearInterval(pulseInterval.current);
    };
  }, []);

  const checkLevelAccess = () => {
    if (userLevel < REQUIRED_LEVEL) {
      setHasLevelAccess(false);
    } else {
      setHasLevelAccess(true);
    }
  };

  const startPulse = () => {
    let increasing = true;
    pulseInterval.current = setInterval(() => {
      setPulseScale(prev => {
        if (increasing && prev >= 1.05) {
          increasing = false;
          return 1.05;
        }
        if (!increasing && prev <= 1) {
          increasing = true;
          return 1;
        }
        return increasing ? prev + 0.01 : prev - 0.01;
      });
    }, 50);
  };

  const handleGetSignal = () => {
    if (!hasLevelAccess) {
      setShowLevelModal(true);
      return;
    }
    generateSignal();
  };

  const generateSignal = () => {
    if (isCharging) return;
    
    setIsCharging(true);
    setShowResult(false);
    setProgress(0);
    
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    const startTime = Date.now();
    const duration = 3000;
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressInterval.current);
        const coeff = generateCoefficient();
        setCoefficient(coeff);
        setShowResult(true);
        setIsCharging(false);
      }
    }, 16);
  };

  const getNewSignal = () => {
    if (!hasLevelAccess) {
      setShowLevelModal(true);
      return;
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
    setIsCharging(false);
    setShowResult(false);
    setCoefficient(null);
    setProgress(0);
    generateSignal();
  };

  const getCoefficientColor = () => {
    const value = parseFloat(coefficient);
    if (value >= 50) return '#ff2c2c';
    if (value >= 30) return '#ff623b';
    if (value >= 20) return '#ff6600';
    if (value >= 15) return '#ff9900';
    if (value >= 10) return '#ffcc00';
    if (value >= 7) return '#ffdd33';
    if (value >= 5) return '#ffee66';
    if (value >= 3) return '#ffff99';
    return '#ffffff';
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="aviator-background">
      <div className="aviator-container">
        <button className="aviator-info-button" onClick={() => setShowInfoModal(true)}>
          i
        </button>

        <div className="aviator-title-container">
          <div className="aviator-title">✦ СИГНАЛЫ AVIATOR ✦</div>
          <div className="aviator-subtitle">Получайте точные прогнозы полетов</div>
          {!hasLevelAccess && (
            <div className="aviator-level-required">Требуется {REQUIRED_LEVEL} уровень</div>
          )}
          {hasLevelAccess && (
            <div className="aviator-level-text">Ваш уровень: {userLevel}</div>
          )}
        </div>

        <div 
          className="aviator-circle-wrapper"
          style={{ transform: `scale(${pulseScale})` }}
        >
          <div className="aviator-circle-outer">
            <div className="aviator-circle-inner">
              {isCharging ? (
                <div className="aviator-progress-container">
                  <div className="aviator-progress-background">
                    <div 
                      className="aviator-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="aviator-progress-text">АНАЛИЗ...</div>
                </div>
              ) : showResult && coefficient ? (
                <>
                  <div 
                    className="aviator-coefficient-value"
                    style={{ color: getCoefficientColor() }}
                  >
                    {coefficient}x
                  </div>
                  <div className="aviator-coefficient-label">СИГНАЛ ГОТОВ</div>
                </>
              ) : !hasLevelAccess ? (
                <div className="aviator-locked-text">🔒 ДОСТУП ЗАКРЫТ</div>
              ) : (
                <div className="aviator-ready-text">ГОТОВ</div>
              )}
            </div>
          </div>
        </div>

        {!isCharging && !showResult && (
          <button 
            className={`aviator-signal-button ${!hasLevelAccess ? 'aviator-signal-button-disabled' : ''}`}
            onClick={handleGetSignal}
          >
            {!hasLevelAccess ? 'УРОВЕНЬ НИЗКИЙ' : 'ПОЛУЧИТЬ СИГНАЛ'}
          </button>
        )}

        {showResult && coefficient && !isCharging && hasLevelAccess && (
          <button className="aviator-new-signal-button" onClick={getNewSignal}>
            НОВЫЙ СИГНАЛ
          </button>
        )}

        {isCharging && hasLevelAccess && (
          <div className="aviator-waiting-container">
            <div className="aviator-waiting-text">АНАЛИЗ ПОЛЕТНЫХ ДАННЫХ...</div>
          </div>
        )}
      </div>

      {showLevelModal && (
        <div className="aviator-modal-overlay" onClick={() => setShowLevelModal(false)}>
          <div className="aviator-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="aviator-modal-title">🔒 ТРЕБУЕТСЯ УРОВЕНЬ 🔒</div>
            
            <div className="aviator-modal-section">
              <div className="aviator-modal-text">
                Сигналы Aviator доступны игрокам с {REQUIRED_LEVEL} уровнем и выше.
              </div>
              <div className="aviator-modal-subtext">
                Ваш текущий уровень: {userLevel}
              </div>
            </div>

            <div className="aviator-modal-section">
              <div className="aviator-modal-subtitle">🎯 Как повысить уровень:</div>
              <div className="aviator-modal-info-text">• Пополняйте счет</div>
              <div className="aviator-modal-info-text">• Играйте в игры регулярно</div>
            </div>

            <button className="aviator-modal-button" onClick={handleGoBack}>
              НАЗАД
            </button>
          </div>
        </div>
      )}

      {showPromoModal && (
        <div className="aviator-modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="aviator-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="aviator-modal-title">✈️ ОБ AVIATOR ✈️</div>
            
            <div className="aviator-modal-section">
              <div className="aviator-modal-text">
                Aviator — культовая игра, любимая миллионами!
                Получайте точные прогнозы перед каждым раундом.
              </div>
            </div>

            <div className="aviator-modal-section">
              <div className="aviator-modal-subtitle">🎮 Как выигрывать в Aviator:</div>
              <div className="aviator-modal-info-text">• Забирайте выигрыш до того, как самолет улетит</div>
              <div className="aviator-modal-info-text">• Используйте мои сигналы для точного тайминга</div>
              <div className="aviator-modal-info-text">• Следите за ростом множителя!</div>
            </div>

            <div className="aviator-modal-section">
              <div className="aviator-modal-subtitle">✨ Мои сигналы помогут вам:</div>
              <div className="aviator-modal-info-text">• Предсказывать момент вывода</div>
              <div className="aviator-modal-info-text">• 100% шанс на выигрыш</div>
              <div className="aviator-modal-info-text">• Получать стабильную прибыль</div>
            </div>

            <div className="aviator-modal-section">
              <div className="aviator-modal-highlight">🚀 Начните использовать сигналы и наблюдайте за ростом ваших выигрышей!</div>
            </div>

            <button className="aviator-modal-button" onClick={() => setShowPromoModal(false)}>
              ПОНЯТНО
            </button>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="aviator-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="aviator-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="aviator-modal-title">✈️ КАК ПОЛЬЗОВАТЬСЯ ✈️</div>
            
            <div className="aviator-modal-section">
              <div className="aviator-modal-subtitle">🎯 Как получить сигнал:</div>
              <div className="aviator-modal-info-text">1. Нажмите кнопку <span className="aviator-highlight">"ПОЛУЧИТЬ СИГНАЛ"</span></div>
              <div className="aviator-modal-info-text">2. Ждите 3 секунды, пока заполняется круг</div>
              <div className="aviator-modal-info-text">3. Получите коэффициент (1.5x - 50x)</div>
            </div>

            <div className="aviator-modal-section">
              <div className="aviator-modal-subtitle">💡 Советы:</div>
              <div className="aviator-modal-info-text">• Используйте сигналы перед каждым полетом</div>
            </div>

            <button className="aviator-modal-button" onClick={() => setShowInfoModal(false)}>
              ПОНЯТНО
            </button>
          </div>
        </div>
      )}
    </div>
  );
};