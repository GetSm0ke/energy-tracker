theme: /



    state: TestCompleted

        event!: test_completed

        script:

            var payload = get_event_payload($context);

            var phrase = payload.phrase || "Серия завершена.";

            $reactions.answer({"value": phrase});

            addSuggestions(["следующий тест", "повтори цифры", "моя статистика", "сброс лимита"], $context);

        q!: (повтори|покажи) (цифры|числа|еще раз)

        q!: не запомнил

        q!: забыл

        a: Повторяю цифры, смотрите на экран.

        script:

            repeatDigits($context);



        q!: (новый тест|пройти еще раз|еще тест|заново|следующий тест)

        a: Начинаем новый тест!

        script:

            startTest($context);



        q!: (моя|покажи) (статистика|результаты|аналитика)

        q!: сколько тестов

        a: Смотрю вашу статистику.

        script:

            showStats($context);



        q!: (пик продуктивности|лучшее время|когда лучше)

        a: Определяю ваш пик продуктивности.

        script:

            showPeak($context);



        q!: (сбрось|сброс|обнули) (дневной )?лимит

        q!: сбросить лимит попыток

        q!: сброс лимита

        a: Сбрасываю дневной лимит.

        script:

            resetDailyLimit($context);



    state: StatsUpdated

        event!: stats_updated

        script:

            var payload = get_event_payload($context);

            var phrase = payload.phrase || "Статистика обновлена.";

            $reactions.answer({"value": phrase});

            addSuggestions(["следующий тест", "начать тест", "моя статистика", "сброс лимита"], $context);



        q!: (повтори|покажи) (цифры|числа|еще раз)

        q!: не запомнил

        q!: забыл

        a: Повторяю цифры, смотрите на экран.

        script:

            repeatDigits($context);



        q!: (новый тест|пройти еще раз|еще тест|заново|следующий тест)

        a: Начинаем новый тест!

        script:

            startTest($context);



        q!: (моя|покажи) (статистика|результаты|аналитика)

        q!: сколько тестов

        a: Смотрю вашу статистику.

        script:

            showStats($context);



        q!: (пик продуктивности|лучшее время|когда лучше)

        a: Определяю ваш пик продуктивности.

        script:

            showPeak($context);



        q!: (сбрось|сброс|обнули) (дневной )?лимит

        q!: сбросить лимит попыток

        q!: сброс лимита

        a: Сбрасываю дневной лимит.

        script:

            resetDailyLimit($context);



    state: PeakFound

        event!: peak_found

        script:

            var payload = get_event_payload($context);

            var peak = payload.peakTime;

            var phrase = payload.phrase || ("Оценка пика по данным: " + peak);

            $reactions.answer({"value": phrase});

            addSuggestions(["следующий тест", "моя статистика", "сброс лимита"], $context);



        q!: (повтори|покажи) (цифры|числа|еще раз)

        q!: не запомнил

        q!: забыл

        a: Повторяю цифры, смотрите на экран.

        script:

            repeatDigits($context);



        q!: (новый тест|пройти еще раз|еще тест|заново|следующий тест)

        a: Начинаем новый тест!

        script:

            startTest($context);



        q!: (моя|покажи) (статистика|результаты|аналитика)

        q!: сколько тестов

        a: Смотрю вашу статистику.

        script:

            showStats($context);



        q!: (пик продуктивности|лучшее время|когда лучше)

        a: Определяю ваш пик продуктивности.

        script:

            showPeak($context);



        q!: (сбрось|сброс|обнули) (дневной )?лимит

        q!: сбросить лимит попыток

        q!: сброс лимита

        a: Сбрасываю дневной лимит.

        script:

            resetDailyLimit($context);

