import React, { useState, useEffect } from 'react';

export default function TestScreen({ onComplete, client }) {
  const [phase, setPhase] = useState('show');
  const [digits, setDigits] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    const randomDigits = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
    setDigits(randomDigits);
  }, []);

  useEffect(() => {
    if (phase === 'show' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (phase === 'show' && timer === 0) {
      setPhase('input');
      // Убираем client.speak, используем sendData если нужно
      if (client) {
        client.sendData({
          action: {
            action_id: 'TIME_IS_OVER',
            parameters: { message: 'Время вышло. Введите запомненные цифры.' }
          }
        });
      }
    }
  }, [phase, timer, client]);

  const handleSubmit = () => {
    const userDigits = userInput.split('').map(Number);
    let correct = 0;
    for (let i = 0; i < 5; i++) {
      if (userDigits[i] === digits[i]) correct++;
    }
    onComplete(correct);
  };

  if (phase === 'show') {
    return (
      <div className="test-screen container">
        <div className="digits-container">
          <div className="digits">
            {digits.join(' ')}
          </div>
          <div className="timer">
            ⏱️ Осталось: {timer} сек
          </div>
        </div>
        <p>Запомните цифры!</p>
      </div>
    );
  }

  return (
    <div className="test-screen container">
      <h2>📝 Введите запомненные цифры</h2>
      <div className="input-form">
        <input
          type="text"
          className="input-field"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Например: 12345"
          maxLength={5}
        />
        <button className="submit-button" onClick={handleSubmit}>
          Проверить
        </button>
      </div>
    </div>
  );
}