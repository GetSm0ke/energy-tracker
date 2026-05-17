// Команды для голосового управления
export const voiceCommands = {
  start: ['запусти трекер энергии', 'начать тест', 'старт'],
  submit: ['готово', 'проверить', 'ответить'],
  repeat: ['повтори цифры', 'еще раз', 'повтори'],
  stats: ['моя статистика', 'результаты', 'покажи аналитику']
};

export function processVoiceCommand(text, client) {
  text = text.toLowerCase();
  
  if (voiceCommands.start.some(cmd => text.includes(cmd))) {
    client.sendData({ type: 'START_GAME' });
    return 'start';
  }
  
  if (voiceCommands.submit.some(cmd => text.includes(cmd))) {
    client.sendData({ type: 'SUBMIT_ANSWER' });
    return 'submit';
  }
  
  if (voiceCommands.stats.some(cmd => text.includes(cmd))) {
    const tests = getTodayTests();
    const peak = getProductivityPeak(tests);
    client.speak(`У вас выполнено ${tests.length} тестов. Пик продуктивности: ${peak}`);
    return 'stats';
  }
  
  return 'unknown';
}