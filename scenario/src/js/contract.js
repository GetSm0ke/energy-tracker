var ACTIONS = {
    START_TEST: "START_TEST",
    REPEAT_DIGITS: "REPEAT_DIGITS",
    SET_TEST_INPUT: "SET_TEST_INPUT",
    SUBMIT_ANSWER: "SUBMIT_ANSWER",
    SHOW_STATS: "SHOW_STATS",
    SHOW_PEAK: "SHOW_PEAK",
    RESET_DAILY_LIMIT: "RESET_DAILY_LIMIT"
};

var EVENTS = {
    TEST_STARTED: "test_started",
    TEST_COMPLETED: "test_completed",
    STATS_UPDATED: "stats_updated",
    PEAK_FOUND: "peak_found"
};

var PHASES = {
    INTRO: "intro",
    TEST: "test",
    FEEDBACK: "feedback",
    RESULT: "result"
};

function isValidAction(actionType) {
    return Object.values(ACTIONS).includes(actionType);
}

function isValidEvent(eventType) {
    return Object.values(EVENTS).includes(eventType);
}
