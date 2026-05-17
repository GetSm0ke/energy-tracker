# Трекер энергии

SmartApp Canvas для Салюта / Sber: когнитивный тренажёр на запоминание цифр. Пользователь проходит короткие серии тестов голосом или кнопками на экране; после пяти прохождений в разное время суток приложение оценивает **пик продуктивности** по часам.

Подробная техническая спецификация: [technical_specification.md](./technical_specification.md).

**Публикация и модерация** (хостинг URL, тексты для Studio, FAQ): [docs/MODERATION.md](./docs/MODERATION.md).

## Структура репозитория

| Часть | Путь | Назначение |
|-------|------|------------|
| Canvas (React) | `src/` | UI, состояние теста, лимиты, `localStorage`, Assistant Client |
| SmartApp Code | `scenario/` | Распознавание фраз, actions в Canvas, озвучка событий |

## Быстрый старт

### Требования

- Node.js 18+
- npm
- Токен смартапа из [Salute Studio](https://developers.sber.ru/docs/ru/va/tools/studio/overview) (для локальной отладки)

### Установка

```powershell
Set-Location c:\PROJECTS\energy-tracker
npm install
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
REACT_APP_TOKEN=ваш_jwt_из_studio
REACT_APP_SMARTAPP=трекер энергии
REACT_APP_MAX_TESTS_PER_DAY=5
```

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `REACT_APP_TOKEN` | для `npm start` | JWT для `createSmartappDebugger` |
| `REACT_APP_SMARTAPP` | нет | Имя в фразе инициализации (`запусти …`). Если пусто или `TODO` — `запусти трекер энергии` |
| `REACT_APP_MAX_TESTS_PER_DAY` | нет | Лимит попыток за календарный день (по умолчанию `5`) |

Переменные `REACT_APP_*` вшиваются **на этапе сборки**. После изменения `.env` выполните `npm run build` заново.

### Режим разработки (Canvas + отладчик Салюта)

```powershell
npm start
```

- Подключается `createSmartappDebugger` (панель ввода и голос в браузере).
- При старте отладчик отправляет фразу `запусти …` — сценарий может сразу выдать `START_TEST` (см. раздел «Известные особенности» в [technical_specification.md](./technical_specification.md)).
- В `src/index.js` включён `React.StrictMode` — в dev эффекты монтируются дважды.

### Production-сборка

```powershell
npm run build
```

Содержимое папки `build/` загружается в Salute Studio как веб-приложение смартапа. В production используется `createAssistant` (нужен хост Салюта, не обычный Chrome).

### Локальный просмотр билда (только UI)

```powershell
npm run preview
```

или:

```powershell
npx serve -s build
```

Проверяются экраны, ввод, лимиты и сохранение в `localStorage`. Голос и сценарий **не работают** без хоста Салюта.

### Полный E2E-тест

1. `npm run build`
2. Salute Studio → смартап → загрузить `build/`
3. Опубликовать сценарий из `scenario/` (или `scenario.zip`, см. спецификацию)
4. Превью в Studio или устройство с приложением Салют

## Сценарий (SmartApp Code)

```powershell
$zip = 'scenario.zip'
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path 'scenario\*' -DestinationPath $zip -Force
```

Архив `scenario.zip` загружается в Studio вместе с Canvas.

XML-тесты сценария: `scenario/test/test.xml` (запускаются при деплое в Studio).

## Основные команды голосом

| Команда | Действие |
|---------|----------|
| начать тест / запусти трекер энергии | Новый тест |
| 1 2 3 … / названные цифры | Заполнить поле ответа |
| готово / проверить | Проверить ответ |
| повтори цифры | Повтор показа цифр (5 сек) |
| моя статистика | Сводка по сериям |
| пик продуктивности | Озвучить пик |
| следующий тест | Новый тест (с экрана результата — через сценарий) |
| сброс лимита | Сброс **дневного** счётчика попыток (серии сохраняются) |

## Ключевые файлы Canvas

- `src/App.jsx` — экраны, Assistant, контракт с сценарием
- `src/dailyLimit.js` — лимит попыток за день
- `src/sessionProgress.js` — серии и пик за календарный день

## Ключевые файлы сценария

- `scenario/chatbot.yaml` — метаданные и intents
- `scenario/src/entryPoint.sc` — команды пользователя
- `scenario/src/sc/gameEvents.sc` — озвучка событий Canvas
- `scenario/src/js/actions.js` — отправка actions в Canvas
