// Сохранение тестов в localStorage
export function saveTestResult(score) {
  const tests = getTodayTests();
  tests.push({
    score: score,
    timestamp: new Date().toISOString(),
    hour: new Date().getHours()
  });
  localStorage.setItem('energy_tests', JSON.stringify(tests));
  return tests;
}

export function getTodayTests() {
  const today = new Date().toDateString();
  const allTests = JSON.parse(localStorage.getItem('energy_tests') || '[]');
  return allTests.filter(test => new Date(test.timestamp).toDateString() === today);
}

export function getProductivityPeak(tests) {
  if (tests.length < 5) return null;
  
  // Группируем по часам
  const hourlyScores = {};
  tests.forEach(test => {
    const hour = new Date(test.timestamp).getHours();
    if (!hourlyScores[hour]) {
      hourlyScores[hour] = { total: 0, count: 0 };
    }
    hourlyScores[hour].total += test.score;
    hourlyScores[hour].count++;
  });
  
  // Находим час с лучшим средним результатом
  let bestHour = null;
  let bestAvg = -1;
  
  for (const [hour, data] of Object.entries(hourlyScores)) {
    const avg = data.total / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestHour = parseInt(hour);
    }
  }
  
  if (!bestHour) return "не определено";
  
  const start = bestHour;
  const end = bestHour + 2;
  return `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`;
}