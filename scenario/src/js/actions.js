function addAction(action, context) {
    var command = {
        type: "smart_app_data",
        smart_app_data: action
    };
    
    for (var index = 0; context.response.replies && index < context.response.replies.length; index++) {
        if (context.response.replies[index].type === "raw" &&
            context.response.replies[index].body &&
            context.response.replies[index].body.items
        ) {
            context.response.replies[index].body.items.push({command: command});
            return;
        }
    }
    
    reply({items: [{command: command}]}, context.response);
}

function startTest(context) {
    addAction({
        type: "START_TEST"
    }, context);
}

function repeatDigits(context) {
    addAction({
        type: "REPEAT_DIGITS"
    }, context);
}

function normalizeSpokenToDigits(text) {
    var s = String(text || "").toLowerCase();
    var pairs = [
        ["ноль", "0"], ["один", "1"], ["одна", "1"], ["два", "2"], ["две", "2"], ["три", "3"],
        ["четыре", "4"], ["пять", "5"], ["шесть", "6"], ["семь", "7"], ["восемь", "8"], ["девять", "9"]
    ];
    var i;
    for (i = 0; i < pairs.length; i++) {
        s = s.split(pairs[i][0]).join(pairs[i][1]);
    }
    return s.replace(/\D/g, "");
}

function fillAnswerDigits(raw, context) {
    var clean = normalizeSpokenToDigits(raw);
    if (clean.length > 5) clean = clean.substring(0, 5);
    if (clean.length < 1) return;
    addAction({
        type: "SET_TEST_INPUT",
        digits: clean
    }, context);
}

function submitAnswer(digits, context) {
    addAction({
        type: "SUBMIT_ANSWER",
        digits: digits
    }, context);
}

function showStats(context) {
    addAction({
        type: "SHOW_STATS"
    }, context);
}

function showPeak(context) {
    addAction({
        type: "SHOW_PEAK"
    }, context);
}

function resetDailyLimit(context) {
    addAction({
        type: "RESET_DAILY_LIMIT"
    }, context);
}
