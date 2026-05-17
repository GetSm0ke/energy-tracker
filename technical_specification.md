# Техническая спецификация: «Трекер энергии»

## 1. Назначение

«Трекер энергии» — SmartApp Canvas-приложение для Салюта/Sber. Пользователь запоминает последовательность из пяти цифр, вводит ответ голосом или с клавиатуры и проходит до пяти **серий** в разное время суток; приложение оценивает **пик продуктивности** по среднему баллу по часам.

Проект разделён на две части:

- React Canvas-приложение в `src/`;
- SmartApp Code сценарий в `scenario/`.

Canvas отвечает за состояние теста, UI, дневной лимит попыток, сохранение прогресса в `localStorage` и отправку событий в SmartApp Code. SmartApp Code отвечает за распознавание пользовательских фраз, преобразование их в **actions** для Canvas и озвучивание событий через `$reactions.answer`.

## 2. Пользовательский сценарий

При открытии приложения пользователь видит **стартовый экран**.

На стартовом экране есть:

- название и описание тренажёра;
- счётчик попыток за сегодня (`Попыток сегодня: N / M`);
- кнопка **«Начать тест (X из 5 осталось)»** — X = оставшиеся серии в текущей «недельной» пятёрке (`5 - testCount`);
- при наличии данных — кнопка **«Моя статистика»** или **«Проверка эффективности»** (если дневной лимит исчерпан);
- при исчерпанном дневном лимите — кнопка **«Сбросить дневной лимит»**;
- при `testCount >= 5` и рассчитанном пике — карточка **«Пик продуктивности»**;
- при `0 < testCount < 5` — прогресс-бар серий.

После **«Начать тест»** (если не исчерпан дневной лимит):

- показываются 5 случайных цифр **5 секунд**;
- затем поле ввода ответа (5 цифр), кнопки **«Проверить»** и **«Повторить цифры»**.

После проверки открывается **экран результата** (балл, tier, полоска). Кнопка **«Следующий тест»** возвращает на стартовый экран (серии и статистика **не сбрасываются**).

Дневной лимит (`REACT_APP_MAX_TESTS_PER_DAY`, по умолчанию 5) ограничивает число **завершённых** попыток за календарный день. Серия из пяти тестов для пика — отдельный счётчик `testCount` (максимум 5 записей в `allResults` за день в рамках сохранённой сессии).

## 3. Игровая логика

### 3.1. Тест на память

- Генерируется массив из 5 цифр `0–9` (`generateDigits` в `src/App.jsx`).
- Таймер запоминания: **5 секунд** (`startMemorizeCountdown`), с защитой от гонок (`memorizeEpochRef`).
- Ответ: ровно 5 цифр; засчитывается **позиционное** совпадение (`score` от 0 до 5).

### 3.2. Серии и пик

- `testCount` — число завершённых серий в сохранённой сессии (цель — 5).
- Каждый результат: `{ score, total: 5, timestamp, hour }`.
- После `testCount >= 5` вызывается `calculatePeak(allResults)` — час с максимальным средним `score`; пик отображается как интервал `HH:00-(HH+2):00`.

### 3.3. Дневной лимит

Модуль `src/dailyLimit.js`:

- ключ `energy-tracker-daily-v1`;
- сброс по календарной дате (`todayLocalKey`);
- `recordCompletedTest()` вызывается в `completeTest`;
- `canStartNewTestToday()` — можно ли начать новый тест сегодня.

### 3.4. Персистентность сессии

Модуль `src/sessionProgress.js`:

- ключ `energy-tracker-progress-v1`;
- за текущий календарный день: `allResults`, `testCount`, `peakTime`;
- восстановление при старте приложения (`loadSessionProgress` в `useMemo` / `useState`);
- сохранение после каждого `completeTest`.

**Сброс дневного лимита** (`resetDailyLimitAndSession`) очищает только счётчик попыток за день; **серии и пик не удаляются**.

### 3.5. Фазы (экраны Canvas)

| Экран `screen` | `phase` для SmartApp (`getAssistantState`) | Описание |
|----------------|--------------------------------------------|----------|
| `start` | `intro` | Старт, статистика, лимит |
| `test` | `test` | Показ / ввод цифр |
| `result` | `result` | Итог серии |

В `scenario/src/js/contract.js` объявлена фаза `feedback`, в UI не используется.

Состояние для ассистента (`getAssistantState`):

- `screen`, `phase`, `testCount`, `peakTime`, `currentDigits`, `lastScore`, `allResults`.

## 4. React Canvas

### 4.1. Ключевые файлы

| Файл | Назначение |
|------|------------|
| `src/App.jsx` | Главный контейнер: `StartScreen`, `TestScreen`, `ResultScreen`, `InfoModal`, Assistant Client, обработка actions |
| `src/dailyLimit.js` | Лимит попыток за день |
| `src/sessionProgress.js` | Сохранение серий и пика за день |
| `src/App.css` | Стили |
| `src/index.js` | Точка входа, `React.StrictMode` |

Компоненты экранов объявлены **внутри** `App.jsx` (не вынесены в `src/pages/`). Файл `src/pages/StartScreen.jsx` — устаревший черновик другой структуры, в сборку не подключается.

### 4.2. Assistant Client

| Режим | Условие | Клиент |
|-------|---------|--------|
| Development | `NODE_ENV === 'development'` и задан `REACT_APP_TOKEN` | `createSmartappDebugger` |
| Production | иначе | `createAssistant` |

Инициализация — один `useEffect` в `App.jsx`; состояние для колбэков синхронизируется через `useRef` (`screenRef`, `testCountRef`, …).

После действий с UI вызывается `markUiAction()` — ~500 мс игнорируются навигационные команды ассистента (`START_TEST`, `RESET_DAILY_LIMIT`), чтобы не дублировать клики.

### 4.3. Отправка событий в сценарий

```javascript
assistant.sendData({
  action: {
    action_id: eventId,
    parameters: parameters,
  },
  name: 'SERVER_ACTION',
  mode: 'background',
});
```

`mode: 'background'` снижает побочные эффекты на UI (саджесты, лишняя навигация) при событиях, инициированных Canvas-кнопками.

Порядок в `completeTest`: сначала обновление UI и `saveSessionProgress`, затем `test_completed` и `stats_updated`.

## 5. SmartApp Code

### 5.1. Ключевые файлы

| Файл | Назначение |
|------|------------|
| `scenario/chatbot.yaml` | Имя EnergyTracker, `entryPoint.sc`, intents, `test.xml` |
| `scenario/src/entryPoint.sc` | Старт, команды, fallback, сброс лимита |
| `scenario/src/sc/gameEvents.sc` | События Canvas: `test_completed`, `stats_updated`, `peak_found` + q! в этих состояниях |
| `scenario/src/sc/gameCommands.sc` | Доп. паттерны (не подключён в `entryPoint.sc`) |
| `scenario/src/js/actions.js` | `addAction`, helpers для Canvas |
| `scenario/src/js/contract.js` | id actions/events/phases |
| `scenario/src/js/getters.js` | request, state, payload, fallback-фразы |
| `scenario/src/js/reply.js` | raw replies, suggestions |
| `scenario/src/js/voicePhrases.js` | Вспомогательные фразы |
| `scenario/test/test.xml` | XML-тесты сценария |

Механизмы сценария:

- глобальные `q!` для команд;
- `event!` для событий Canvas;
- `$reactions.answer({"value": phrase})` для озвучки;
- `reply({ items: [{ command }] })` для `smart_app_data` (формат с `items`).

## 6. Голосовые команды

### 6.1. Старт и навигация

- `запусти трекер энергии`, `трекер энергии`, `проверь память`, `тест на память`, `начать тест` → `START_TEST`;
- `следующий тест`, `новый тест`, `еще тест`, `заново` → `START_TEST` (из состояний после событий и `RestartTest`);
- `помощь`, `что делать`, `как пользоваться` → текст справки (без action).

### 6.2. Во время теста

- Цифры (`$digits` в `entryPoint.sc`) или произнесённые числительные (fallback + `normalizeSpokenToDigits`) → `SET_TEST_INPUT`;
- `готово`, `ответить`, `проверить`, `отправить` → `SUBMIT_ANSWER`;
- `повтори цифры`, `не запомнил`, `забыл` → `REPEAT_DIGITS`.

### 6.3. Статистика и лимит

- `моя статистика`, `сколько тестов` → `SHOW_STATS` (модальное окно в Canvas);
- `пик продуктивности`, `лучшее время` → `SHOW_PEAK` (озвучка через event или фразу);
- `сброс лимита`, `сбросить лимит попыток` → `RESET_DAILY_LIMIT`.

Подсказки сценария (`addSuggestions`) используют `action.type = "text"`: нажатие отправляет текст в `q!`, как голос.

## 7. Контракт Canvas и SmartApp Code

### 7.1. Actions из SmartApp Code в Canvas

| Action | Поведение Canvas |
|--------|------------------|
| `START_TEST` | `startTest()`, если экран не `test` |
| `REPEAT_DIGITS` | `repeatDigits()`, только на экране `test` |
| `SET_TEST_INPUT` | `setTestInput(digits)`, до 5 цифр |
| `SUBMIT_ANSWER` | `completeTest(score)`, только на `test`, ответ из action или поля |
| `SHOW_STATS` | модальное окно статистики |
| `SHOW_PEAK` | озвучка пика / прогресса через `sendEventToScenario` |
| `RESET_DAILY_LIMIT` | `resetDailyLimitAndSession()` |

Формат от сценария (через `actions.js`):

```json
{
  "items": [
    {
      "command": {
        "type": "smart_app_data",
        "smart_app_data": { "type": "START_TEST" }
      }
    }
  ]
}
```

Canvas разбирает и плоский `{ "type": "START_TEST" }`, и массив `items[].command` (`extractSmartAppActions` в `App.jsx`).

### 7.2. Events из Canvas в SmartApp Code

| Event (`action_id`) | Когда |
|---------------------|--------|
| `test_started` | После старта теста (`digits`, `testNumber`) |
| `digits_repeated` | Повтор показа цифр |
| `test_completed` | После проверки (`score`, `total`, `phrase`) |
| `stats_updated` | Сводка (`testCount`, `bestScore`, `peakTime`, `phrase`) |
| `peak_found` | После 5-й серии при расчёте пика |

Payload читается в `get_event_payload` из `data.action.parameters` / `data.eventData`.

Состояния сценария: `TestCompleted`, `StatsUpdated`, `PeakFound` (`gameEvents.sc`).

## 8. Тайминги и синхронизация UI

| Параметр | Значение |
|----------|----------|
| Показ цифр | 5 с |
| Интервал таймера | 1 с |
| Блокировка эхо-команд UI | 500 мс (`ignoreAssistantCommandsUntilRef`) |

Отдельного voice scheduler (как в «Голосовом Квизе») нет: одна реплика на событие через `$reactions.answer`.

Callback `assistant.sendData` **не гарантирует** окончание TTS; UI не блокируется по длительности озвучки.

## 9. Тестирование

### 9.1. Canvas

Сборка:

```powershell
npm run build
```

Локальный просмотр UI (без Салюта):

```powershell
npm run preview
```

или `npx serve -s build`.

Unit-тестов React в репозитории нет.

### 9.2. SmartApp Code

XML-тесты: `scenario/test/test.xml`:

- `start_test` → `START_TEST`;
- `repeat_digits` → `REPEAT_DIGITS`;
- `submit_answer` (ввод `1`) → ожидание `SUBMIT_ANSWER` (фактически сценарий на `1` срабатывает `SubmitDigits` → `fillAnswerDigits`; тест может требовать актуализации под `SET_TEST_INPUT`).

Тесты выполняются при деплое сценария в Studio.

### 9.3. Development vs production

| | `npm start` | `npm run build` + Studio / Салют |
|---|-------------|-------------------------------------|
| `createSmartappDebugger` | да | нет |
| Панель отладчика | да | нет |
| Авто-`initPhrase` → возможен лишний `START_TEST` | да | нет |
| `React.StrictMode` двойной mount | да (только dev) | нет |
| Голос в обычном Chrome | через отладчик | нет |

## 10. Сборка и деплой

### 10.1. Canvas

```powershell
npm run build
```

Артефакт: каталог `build/`.

### 10.2. SmartApp Code

Исходники: `scenario/`.

Архив для Studio:

```powershell
$zip = 'scenario.zip'
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path 'scenario\*' -DestinationPath $zip -Force
```

После изменений в `scenario/` архив нужно пересобрать.

## 11. Известные риски и особенности

### 11.1. TTS и sendData

Callback подтверждает доставку события в сценарий, не конец речи. Озвучка и UI могут расходиться по времени.

### 11.2. Debugger и устройство

Скорость TTS, саджесты и поведение `background` / `foreground` server action могут отличаться между SmartApp Debugger и продакшен-хостом.

### 11.3. Двойной старт в dev

`createSmartappDebugger` при старте шлёт `initPhrase` (`запусти трекер энергии`); сценарий `Start` вызывает `startTest()` → `START_TEST`. В сочетании с `React.StrictMode` возможен **двойной** запуск при `npm start`. В production-сборке в Салюте этого обычно нет.

### 11.4. Глобальные q!

Команды вроде `проверить` и цифр глобальны — возможны ложные срабатывания ASR; Canvas частично гасит эхо после UI-кликов.

### 11.5. Нет серверной валидации

Вся логика и лимиты на клиенте; данные в `localStorage` можно изменить вручную.

### 11.6. Локальная персистентность

Данные привязаны к браузеру и календарному дню. Другой браузер или очистка хранилища — «пустая» статистика.

### 11.7. `scenario.zip` может устареть

Изменения в `scenario/` без пересборки архива → старая версия в Studio.

### 11.8. E2E вручную

Рекомендуемая цепочка для регресса:

```text
голос/кнопка → SmartApp Code → Canvas action → state → sendData (background) → event! → TTS
```

Проверять в SmartApp Debugger и на целевом устройстве с опубликованным `build/`.

### 11.9. Событие `digits_repeated`

Canvas отправляет `digits_repeated`; в `gameEvents.sc` отдельного `event!` нет — озвучка повтора только через UI/таймер.
