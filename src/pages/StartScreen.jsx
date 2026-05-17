import React, { useState, useEffect } from 'react';
import ResultsChart from '../components/ResultsChart';
import { getTodayTests } from '../game/engine/testEngine';

export default function StartScreen({ onStart, peakTime, client }) {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    setTests(getTodayTests());
  }, []);

  const testsLeft = 5 - tests.length;

  return (
    <div className="start-screen container">
      <h1 className="title">🧠 Трекер энергии</h1>
      <p className="subtitle">
        Голосовой когнитивный ассистент<br/>
        Определи свой пик продуктивности
      </p>
      
      <button className="start-button" onClick={onStart}>
        Начать тест ({testsLeft} из 5 осталось)
      </button>

      {tests.length > 0 && (
        <div className="stats">
          <p>✅ Сегодня выполнено тестов: {tests.length}/5</p>
          <div style={{ marginTop: 10 }}>
            {tests.map((test, i) => (
              <div key={i} style={{ fontSize: 12, marginTop: 5 }}>
                {new Date(test.timestamp).toLocaleTimeString()}: {test.score}/5
              </div>
            ))}
          </div>
        </div>
      )}

      {peakTime && (
        <div className="peak-card">
          <h3>🎯 Ваш пик продуктивности</h3>
          <div className="peak-time">{peakTime}</div>
          <p>Планируйте важные дела на это время!</p>
        </div>
      )}

      {tests.length > 0 && <ResultsChart data={tests} />}
      
      <div style={{ marginTop: 30, fontSize: 12, opacity: 0.7 }}>
        💡 Совет: Пройдите 5 тестов в разное время дня для точного определения пика продуктивности
      </div>
    </div>
  );
}