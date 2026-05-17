require: js/actions.js
require: js/contract.js
require: js/getters.js
require: js/reply.js
require: js/voicePhrases.js

require: sc/gameEvents.sc

patterns:
    $AnyText = $nonEmptyGarbage
    $digit = [0-9]
    $digits = $digit{1,5}

theme: /

    state: Start
        q!: $regex</start>
        q!: (запусти|открой|включи) трекер энергии
        q!: трекер энергии
        q!: проверь память
        q!: тест на память
        q!: начать тест
        a: Запускаю Трекер энергии. Запомните цифры на экране.
        script:
            startTest($context);

    state: RepeatDigits
        q!: (повтори|покажи) (цифры|числа|еще раз)
        q!: не запомнил
        q!: забыл
        q!: еще раз
        a: Повторяю цифры, смотрите на экран.
        script:
            repeatDigits($context);

    state: SubmitDigits
        q!: ($digits)
        script:
            fillAnswerDigits($parseTree.text, $context);
        a: Записала цифры в поле. Скажите «готово» или нажмите «Проверить».

    state: SubmitAnswer
        q!: (готово|ответить|проверить|отправить)
        script:
            submitAnswer("", $context);
        a: Проверяю ваш ответ.

    state: ShowStats
        q!: (моя|покажи) (статистика|результаты|аналитика)
        q!: сколько тестов
        a: Смотрю вашу статистику.
        script:
            showStats($context);

    state: ShowPeak
        q!: (пик продуктивности|лучшее время|когда лучше)
        a: Определяю ваш пик продуктивности.
        script:
            showPeak($context);

    state: Help
        q!: (помощь|что делать|как пользоваться|подскажи)
        a: Вас приветствует Трекер энергии. Скажите «начать тест» — покажу 5 цифр на несколько секунд. Назовите или введите цифры в поле и скажите «готово» или нажмите «Проверить». Пять тестов в разное время дня — и подскажу пик продуктивности. Если лимит на сегодня закончился, можно сказать «сброс лимита» для сброса счётчика в этом браузере.

    state: RestartTest
        q!: (новый тест|пройти еще раз|еще тест|заново|следующий тест)
        a: Начинаем новый тест!
        script:
            startTest($context);

    state: ResetDailyLimit
        q!: (сбрось|сброс|обнули) (дневной )?лимит
        q!: сбросить лимит попыток
        q!: сброс лимита
        a: Сбрасываю дневной лимит попыток. Пройденные серии и статистика сохраняются.
        script:
            resetDailyLimit($context);

    state: Fallback
        event!: noMatch
        script:
            var request = get_request($context);
            var gameState = get_game_state(request);
            var phase = gameState && gameState.phase;
            var textTry = get_user_text(request);
            var digitsTry = normalizeSpokenToDigits(textTry);
            if (phase === "test" && digitsTry.length > 0) {
                fillAnswerDigits(digitsTry, $context);
                $reactions.answer({"value": "Записала цифры. Скажите «готово» или нажмите «Проверить»."});
                addSuggestions(["повтори цифры", "готово", "помощь"], $context);
            } else {
                var suggestions = get_fallback_suggestions(phase);
                $reactions.answer({"value": get_fallback_phrase(phase)});
                addSuggestions(suggestions, $context);
            }