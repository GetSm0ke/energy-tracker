function get_request(context) {
    if (context && context.request)
        return context.request.rawRequest;
    return {};
}

function get_user_text(request) {
    var r = request || {};
    var p = r.payload || {};
    var m = p.message;
    if (m && typeof m.text === "string" && m.text.length) return m.text;
    if (m && typeof m.original_text === "string" && m.original_text.length) return m.original_text;
    if (p.data && p.data.message && typeof p.data.message.text === "string") return p.data.message.text;
    return "";
}

function get_server_action(request) {
    if (request &&
        request.payload &&
        request.payload.data &&
        request.payload.data.server_action) {
        return request.payload.data.server_action;
    }
    return {};
}

function get_game_state(request) {
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state) {
        return request.payload.meta.current_app.state;
    }
    return { phase: "intro", testCount: 0 };
}

function get_event_payload(context) {
    var request = get_request(context);
    if (request &&
        request.payload &&
        request.payload.data &&
        request.payload.data.action &&
        request.payload.data.action.parameters) {
        return request.payload.data.action.parameters;
    }
    if (request &&
        request.payload &&
        request.payload.data &&
        request.payload.data.eventData) {
        return request.payload.data.eventData;
    }
    return {};
}

function get_phase(request) {
    var state = get_game_state(request);
    return state.phase || "intro";
}

function get_test_count(request) {
    var state = get_game_state(request);
    return state.testCount || 0;
}

function get_fallback_phrase(phase) {
    if (phase === "intro") {
        return "Скажите 'начать тест', чтобы проверить память";
    } else if (phase === "test") {
        return "Скажите 5 цифр или введите их в поле, затем «готово» или кнопку «Проверить». Можно сказать «повтори цифры».";
    } else if (phase === "feedback") {
        return "Подождите, проверяю результат";
    } else if (phase === "result") {
        return "Скажите «следующий тест», чтобы вернуться к началу, «повтори цифры» — если снова на экране с цифрами, «моя статистика» или «сброс лимита».";
    } else {
        return "Не понял команду. Скажите 'помощь' для списка команд";
    }
}

function get_fallback_suggestions(phase) {
    if (phase === "intro") {
        return ["начать тест", "помощь"];
    } else if (phase === "test") {
        return ["повтори цифры", "готово", "помощь"];
    } else if (phase === "feedback") {
        return ["помощь"];
    } else if (phase === "result") {
        return ["следующий тест", "повтори цифры", "моя статистика", "сброс лимита", "помощь"];
    } else {
        return ["начать тест", "моя статистика", "помощь"];
    }
}