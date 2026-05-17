import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import {
    canStartNewTestToday,
    getMaxTestsPerDay,
    loadDailyCompletedCount,
    recordCompletedTest,
    clearDailyCompletedCount,
} from './dailyLimit';
import { loadSessionProgress, saveSessionProgress } from './sessionProgress';
import './App.css';

function InfoModal({ title, text, onClose, onResetDailyLimit }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="modal-title" className="modal-title">
                    {title}
                </h2>
                <p className="modal-text">{text}</p>
                <div className="modal-actions">
                    <button type="button" className="submit-button modal-close" onClick={onClose}>
                        Понятно
                    </button>
                    {onResetDailyLimit && (
                        <button
                            type="button"
                            className="reset-limit-button modal-reset"
                            onClick={(e) => {
                                e.stopPropagation();
                                onResetDailyLimit();
                            }}
                        >
                            Сбросить дневной лимит
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function StartScreen({
    onStart,
    testCount,
    peakTime,
    onShowStats,
    dailyCompleted,
    dailyMax,
    canStartToday,
    canShowStats,
    statsButtonLabel,
    showDailyReset,
    onResetDailyLimit,
}) {
    const testsLeft = 5 - testCount;

    return (
        <div className="start-screen container">
            <p className="title-kicker">Когнитивный тренажёр</p>
            <h1 className="title">Трекер энергии</h1>
            <p className="subtitle">
                Запоминайте цифры, отмечайте время прохождения — в конце недели увидите, в какие часы вам
                проще концентрироваться.
            </p>

            <p className="daily-limit-hint">
                Попыток сегодня: {dailyCompleted} / {dailyMax}
                {!canStartToday && (
                    <span className="daily-limit-warn"> — лимит исчерпан, зайдите завтра</span>
                )}
            </p>

            <button
                type="button"
                className="start-button"
                onClick={onStart}
                disabled={!canStartToday}
                title={!canStartToday ? 'Достигнут дневной лимит попыток' : undefined}
            >
                Начать тест ({testsLeft} из 5 осталось)
            </button>

            {canShowStats && (
                <button type="button" className="stats-button" onClick={onShowStats}>
                    {statsButtonLabel}
                </button>
            )}

            {showDailyReset && (
                <button type="button" className="reset-limit-button" onClick={onResetDailyLimit}>
                    Сбросить дневной лимит
                </button>
            )}

            {peakTime && (
                <div className="peak-card">
                    <h3 className="peak-heading">Пик продуктивности</h3>
                    <div className="peak-time">{peakTime}</div>
                    <p className="peak-note">Совпадает с окном, где у вас стабильнее всего получалась серия тестов.</p>
                </div>
            )}
            
            {testCount > 0 && testCount < 5 && (
                <div className="progress">
                    <p className="progress-title">Пройдено тестов: {testCount} из 5</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(testCount / 5) * 100}%` }}></div>
                    </div>
                    <p className="hint">
                        Для оценки по часам пройдите все пять тестов в разное время суток.
                    </p>
                </div>
            )}
        </div>
    );
}

function TestScreen({
    digits,
    showDigits,
    memorizeTimeLeft,
    inputValue,
    onInputChange,
    onSubmit,
    onRepeat,
}) {
    const handleSubmit = () => {
        if (inputValue.replace(/\D/g, '').length === 5) {
            onSubmit(inputValue.replace(/\D/g, ''));
        }
    };

    return (
        <div className="test-screen container">
            <div className="test-card glass">
                <p className="test-phase-label">
                    {showDigits ? 'Запомните последовательность' : 'Введите запомненные цифры'}
                </p>
                <div className="digits-container" aria-live="polite">
                    {showDigits ? (
                        <div className="digits digits--visible">{digits.join(' ')}</div>
                    ) : (
                        <div className="digits digits--hidden" aria-hidden>
                            <span className="digit-slot">•</span>
                            <span className="digit-slot">•</span>
                            <span className="digit-slot">•</span>
                            <span className="digit-slot">•</span>
                            <span className="digit-slot">•</span>
                        </div>
                    )}
                    <div className={`timer-ring ${showDigits ? 'timer-ring--pulse' : ''}`}>
                        <span className="timer-value">{showDigits ? memorizeTimeLeft : '—'}</span>
                        <span className="timer-caption">
                            {showDigits ? 'сек до скрытия' : 'поле ввода'}
                        </span>
                    </div>
                </div>

                <div className="input-area">
                    <label className="input-label" htmlFor="digit-input">
                        Ваш ответ (5 цифр)
                    </label>
                    <input
                        id="digit-input"
                        type="text"
                        inputMode="numeric"
                        className="input-field"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="····"
                        maxLength={5}
                        autoComplete="off"
                        autoFocus
                    />
                    <div className="input-slots" aria-hidden>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <span
                                key={i}
                                className={`input-slot ${inputValue[i] ? 'input-slot--filled' : ''}`}
                            >
                                {inputValue[i] || '·'}
                            </span>
                        ))}
                    </div>
                    <div className="button-group">
                        <button
                            type="button"
                            className="submit-button"
                            onClick={handleSubmit}
                            disabled={inputValue.length !== 5}
                        >
                            Проверить
                        </button>
                        <button type="button" className="repeat-button" onClick={onRepeat}>
                            Повторить цифры
                        </button>
                    </div>
                </div>

                <p className="voice-hint">
                    Назовите цифры по одной или подряд — они появятся в поле. Затем скажите
                    «готово» или нажмите «Проверить».
                </p>
            </div>
        </div>
    );
}

function ResultScreen({ score, total, onRestart, showDailyReset, onResetDailyLimit }) {
    const percentage = (score / total) * 100;
    let tierClass = 'result-tier--mid';
    let tierLabel = 'Неплохо';
    let message = '';

    if (score === total) {
        tierClass = 'result-tier--high';
        tierLabel = 'Безупречно';
        message = 'Все пять цифр совпали с показанной последовательностью.';
    } else if (score >= 3) {
        tierClass = 'result-tier--good';
        tierLabel = 'Уверенно';
        message = `Совпало ${score} из ${total} позиций — хороший запас внимания.`;
    } else {
        tierClass = 'result-tier--low';
        tierLabel = 'Есть куда расти';
        message = `Совпало ${score} из ${total}. Повторите тест в другое время или после отдыха.`;
    }

    return (
        <div className="result-screen container">
            <div className="result-card">
                <p className={`result-tier ${tierClass}`}>{tierLabel}</p>
                <h2>Результат</h2>
                <div className="result-score">
                    <span className="score-value">{score}</span>
                    <span className="score-total">/{total}</span>
                </div>
                <p className="result-message">{message}</p>
                <div className="result-bar">
                    <div
                        className="result-fill"
                        style={{
                            width: `${percentage}%`,
                            background: percentage >= 60 ? '#4ec9b0' : '#f48771',
                        }}
                    />
                </div>
                {showDailyReset && onResetDailyLimit && (
                    <button type="button" className="reset-limit-button result-reset" onClick={onResetDailyLimit}>
                        Сбросить дневной лимит
                    </button>
                )}
                <button type="button" className="restart-button" onClick={onRestart}>
                    Следующий тест
                </button>
            </div>
        </div>
    );
}

function App() {
    const initialSession = useMemo(() => {
        const s = loadSessionProgress();
        return {
            testCount: s?.testCount ?? 0,
            allResults: s?.allResults ?? [],
            peakTime: s?.peakTime ?? null,
        };
    }, []);

    const [screen, setScreen] = useState('start');
    const [testCount, setTestCount] = useState(initialSession.testCount);
    const [peakTime, setPeakTime] = useState(initialSession.peakTime);
    const [currentDigits, setCurrentDigits] = useState([0, 0, 0, 0, 0]);
    const [timeLeft, setTimeLeft] = useState(5);
    const [lastScore, setLastScore] = useState(0);
    const [allResults, setAllResults] = useState(initialSession.allResults);
    const [testInput, setTestInput] = useState('');
    const [dailyCompleted, setDailyCompleted] = useState(() => loadDailyCompletedCount().count);
    const [modal, setModal] = useState(null);

    const closeModal = useCallback(() => setModal(null), []);
    const assistantRef = useRef(null);
    const screenRef = useRef(screen);
    const testCountRef = useRef(testCount);
    const peakTimeRef = useRef(peakTime);
    const currentDigitsRef = useRef(currentDigits);
    const lastScoreRef = useRef(lastScore);
    const allResultsRef = useRef(allResults);
    const testInputRef = useRef(testInput);
    const callbacksRef = useRef({});
    const timerRef = useRef(null);
    const memorizeEpochRef = useRef(0);
    const ignoreAssistantCommandsUntilRef = useRef(0);

    screenRef.current = screen;
    testCountRef.current = testCount;
    peakTimeRef.current = peakTime;
    currentDigitsRef.current = currentDigits;
    lastScoreRef.current = lastScore;
    allResultsRef.current = allResults;
    testInputRef.current = testInput;

    useEffect(() => {
        const syncDaily = () => setDailyCompleted(loadDailyCompletedCount().count);
        window.addEventListener('focus', syncDaily);
        return () => window.removeEventListener('focus', syncDaily);
    }, []);
    const generateDigits = () => {
        return Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
    };
    const calculatePeak = (results) => {
        if (results.length < 5) return null;
        
        const hourlyStats = {};
        results.forEach(result => {
            const hour = new Date(result.timestamp).getHours();
            if (!hourlyStats[hour]) {
                hourlyStats[hour] = { total: 0, count: 0 };
            }
            hourlyStats[hour].total += result.score;
            hourlyStats[hour].count++;
        });
        
        let bestHour = null;
        let bestAvg = -1;
        
        for (const [hour, data] of Object.entries(hourlyStats)) {
            const avg = data.total / data.count;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestHour = parseInt(hour);
            }
        }
        
        if (bestHour === null) return null;
        
        const start = bestHour;
        const end = bestHour + 2;
        return `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`;
    };
    const markUiAction = () => {
        ignoreAssistantCommandsUntilRef.current = Date.now() + 500;
    };

    const sendEventToScenario = (eventId, parameters) => {
        const assistant = assistantRef.current;
        if (assistant) {
            assistant.sendData({
                action: {
                    action_id: eventId,
                    parameters: parameters,
                },
                name: 'SERVER_ACTION',
                mode: 'background',
            });
        }
    };

    const extractSmartAppActions = (smartAppData) => {
        if (!smartAppData || typeof smartAppData !== 'object') return [];
        if (Array.isArray(smartAppData.items)) {
            return smartAppData.items
                .map((item) => (item && item.command ? item.command : item))
                .filter((action) => action && action.type);
        }
        if (smartAppData.command && smartAppData.command.type) {
            return [smartAppData.command];
        }
        if (smartAppData.type) {
            return [smartAppData];
        }
        return [];
    };
    const startMemorizeCountdown = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        const epoch = ++memorizeEpochRef.current;
        setTimeLeft(5);
        timerRef.current = setInterval(() => {
            if (memorizeEpochRef.current !== epoch) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                return;
            }
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    const startTest = () => {
        markUiAction();
        if (!canStartNewTestToday()) {
            const max = getMaxTestsPerDay();
            setModal({
                title: 'Лимит на сегодня',
                text: `За календарный день доступно не более ${max} попыток. Новые тесты будут доступны завтра.`,
            });
            return;
        }

        const newDigits = generateDigits();
        setTestInput('');
        setCurrentDigits(newDigits);
        screenRef.current = 'test';
        setScreen('test');

        sendEventToScenario('test_started', {
            digits: newDigits.join(''),
            testNumber: testCount + 1,
        });

        startMemorizeCountdown();
    };
    const repeatDigits = () => {
        markUiAction();
        sendEventToScenario('digits_repeated', {
            digits: currentDigits.join(''),
        });
        startMemorizeCountdown();
    };
    const completeTest = (score) => {
        markUiAction();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        memorizeEpochRef.current += 1;

        const prevResults = allResultsRef.current;
        const prevCount = testCountRef.current;

        const newResult = {
            score: score,
            total: 5,
            timestamp: new Date().toISOString(),
            hour: new Date().getHours()
        };

        const newResults = [...prevResults, newResult];
        const newCount = prevCount + 1;

        let nextPeak = peakTimeRef.current;
        if (newCount >= 5) {
            const peak = calculatePeak(newResults);
            if (peak) {
                nextPeak = peak;
                setPeakTime(peak);
                sendEventToScenario('peak_found', {
                    peakTime: peak,
                    phrase: `По пяти прохождениям наиболее удачный интервал приходится на ${peak}. Используйте его для задач, где важна концентрация.`,
                });
            }
        }

        allResultsRef.current = newResults;
        testCountRef.current = newCount;
        peakTimeRef.current = nextPeak;

        setAllResults(newResults);
        setLastScore(score);

        let message = '';
        if (score === 5) {
            message = 'Все пять цифр совпали с показанной последовательностью.';
        } else if (score >= 3) {
            message = `Совпало ${score} из пяти позиций — устойчивый результат.`;
        } else {
            message = `Совпало ${score} из пяти. Имеет смысл повторить тест позже.`;
        }

        setTestCount(newCount);
        setTestInput('');
        screenRef.current = 'result';
        setScreen('result');

        saveSessionProgress({
            allResults: newResults,
            testCount: newCount,
            peakTime: nextPeak,
        });

        recordCompletedTest();
        setDailyCompleted(loadDailyCompletedCount().count);

        sendEventToScenario('test_completed', {
            score: score,
            total: 5,
            phrase: message,
        });

        sendEventToScenario('stats_updated', {
            testCount: newCount,
            bestScore: Math.max(...newResults.map((r) => r.score), 0),
            peakTime: nextPeak || 'ещё не определён',
            phrase: `Пройдено серий: ${newCount} из пяти. ${nextPeak ? `Сейчас оценённый пик: ${nextPeak}.` : 'Для оценки по часам завершите все пять серий.'}`,
        });
    };
    
    const showStats = () => {
        markUiAction();
        const limitReached = !canStartNewTestToday();
        const modalTitle = limitReached ? 'Проверка эффективности' : 'Моя статистика';

        if (allResults.length === 0) {
            const max = getMaxTestsPerDay();
            const statsMessage = limitReached
                ? `Сегодняшний лимит попыток исчерпан (${dailyCompleted} из ${max}). Сводка по баллам и пику появится здесь после прохождения тестов в этом браузере.`
                : 'Пройдите хотя бы один тест, чтобы появилась статистика.';

            sendEventToScenario('stats_updated', {
                testCount: testCount,
                bestScore: 0,
                avgScore: 0,
                peakTime: peakTime ?? 'ещё не определён',
                phrase: statsMessage,
            });

            setModal({ title: modalTitle, text: statsMessage });
            return;
        }

        const bestScore = Math.max(0, ...allResults.map((r) => r.score));
        const avgScore =
            allResults.length > 0
                ? (allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length).toFixed(1)
                : 0;

        const statsMessage = [
            `Серий пройдено: ${testCount} из пяти.`,
            `Лучший результат: ${bestScore} из пяти совпадений.`,
            `Средний балл: ${avgScore} из пяти.`,
            peakTime
                ? `Оценка пика по данным: ${peakTime}.`
                : 'Чтобы оценить пик по часам, завершите все пять серий в разное время суток.',
        ].join('\n');

        sendEventToScenario('stats_updated', {
            testCount: testCount,
            bestScore: bestScore,
            avgScore: avgScore,
            peakTime: peakTime,
            phrase: statsMessage,
        });

        setModal({ title: modalTitle, text: statsMessage });
    };

    const restartTest = useCallback(() => {
        markUiAction();
        screenRef.current = 'start';
        setScreen('start');
    }, []);

    const resetDailyLimitAndSession = useCallback(() => {
        markUiAction();
        try {
            clearDailyCompletedCount();
        } catch {
            /* ignore */
        }
        setModal(null);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        memorizeEpochRef.current += 1;
        if (screenRef.current === 'test') {
            screenRef.current = 'start';
            setScreen('start');
        }
        setDailyCompleted(loadDailyCompletedCount().count);
    }, []);

    callbacksRef.current = {
        startTest,
        repeatDigits,
        completeTest,
        showStats,
        setTestInput,
        restartTest,
        resetDailyLimitAndSession,
    };
    
    useEffect(() => {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev && !process.env.REACT_APP_TOKEN) {
            console.error('Режим разработки: задайте REACT_APP_TOKEN в .env');
            return undefined;
        }

        const smartAppName = process.env.REACT_APP_SMARTAPP;
        const initPhrase =
            smartAppName && smartAppName.trim() && smartAppName !== 'TODO'
                ? `запусти ${smartAppName.trim()}`
                : 'запусти трекер энергии';

        const getAssistantState = () => ({
            screen: screenRef.current,
            phase:
                screenRef.current === 'start'
                    ? 'intro'
                    : screenRef.current === 'test'
                      ? 'test'
                      : 'result',
            testCount: testCountRef.current,
            peakTime: peakTimeRef.current,
            currentDigits: currentDigitsRef.current,
            lastScore: lastScoreRef.current,
            allResults: allResultsRef.current,
        });

        let unsubscribe = () => {};

        const shouldIgnoreAssistantNavigation = () =>
            Date.now() < ignoreAssistantCommandsUntilRef.current;

        const applyAssistantAction = (action) => {
            if (!action || !action.type) return;

            const { repeatDigits: rd, completeTest: ct, showStats: ss, setTestInput: sti, startTest: stGo } =
                callbacksRef.current;
            const scr = screenRef.current;
            const digits = currentDigitsRef.current;
            const actionType = String(action.type);

            switch (actionType) {
                case 'START_TEST':
                    if (shouldIgnoreAssistantNavigation()) break;
                    if (screenRef.current !== 'test') stGo?.();
                    break;
                case 'REPEAT_DIGITS':
                    if (scr === 'test') rd?.();
                    break;
                case 'SET_TEST_INPUT': {
                    const d =
                        action.digits != null
                            ? String(action.digits).replace(/\D/g, '').slice(0, 5)
                            : '';
                    sti?.(d);
                    break;
                }
                case 'SUBMIT_ANSWER': {
                    if (scr !== 'test') break;
                    const fromAction = String(action.digits ?? '')
                        .replace(/\D/g, '')
                        .slice(0, 5);
                    const fromField = testInputRef.current.replace(/\D/g, '').slice(0, 5);
                    const answer = fromAction.length === 5 ? fromAction : fromField;
                    if (answer.length !== 5) break;
                    const userDigits = answer.split('').map(Number);
                    let correct = 0;
                    for (let i = 0; i < 5; i++) {
                        if (userDigits[i] === digits[i]) correct++;
                    }
                    ct?.(correct);
                    break;
                }
                case 'SHOW_STATS':
                    ss?.();
                    break;
                case 'SHOW_PEAK': {
                    const pt = peakTimeRef.current;
                    const tc = testCountRef.current;
                    if (pt) {
                        sendEventToScenario('peak_found', {
                            peakTime: pt,
                            phrase: `По текущим данным пик приходится на ${pt}.`,
                        });
                    } else {
                        sendEventToScenario('stats_updated', {
                            phrase: `Пройдено ${tc} из пяти серий; продолжайте в разное время суток, чтобы уточнить картину.`,
                        });
                    }
                    break;
                }
                case 'RESET_DAILY_LIMIT':
                case 'reset_daily_limit':
                    if (shouldIgnoreAssistantNavigation()) break;
                    callbacksRef.current.resetDailyLimitAndSession?.();
                    break;
                default:
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[assistant] unknown action', actionType);
                    }
            }
        };

        const onAssistantData = (command) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[assistant] data', command);
            }

            if (command.type === 'smart_app_data' && command.smart_app_data) {
                extractSmartAppActions(command.smart_app_data).forEach(applyAssistantAction);
            }

            if (command.type === 'server_action') {
                const actionId =
                    command.action_id ??
                    (command.server_action && command.server_action.action_id) ??
                    (command.server_action && command.server_action.type);
                if (actionId) {
                    applyAssistantAction({ type: String(actionId) });
                }
            }
        };

        try {
            let assistant;
            if (isDev) {
                assistant = createSmartappDebugger({
                    token: process.env.REACT_APP_TOKEN,
                    initPhrase,
                    settings: { dubbing: true },
                    getState: getAssistantState,
                    getRecoveryState: () => ({}),
                    surface: 'COMPANION',
                    nativePanel: {
                        defaultText: 'Скажите или напишите...',
                        screenshotMode: false,
                    },
                });
            } else {
                assistant = createAssistant({
                    getState: getAssistantState,
                    getRecoveryState: () => ({}),
                });
            }

            assistantRef.current = assistant;
            unsubscribe = assistant.on('data', onAssistantData);
        } catch (error) {
            console.error('Ошибка инициализации ассистента', error);
        }

        return () => {
            unsubscribe();
            assistantRef.current?.close();
            assistantRef.current = null;
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- один экземпляр; состояние через refs
    }, []);
    
    const canStartToday = canStartNewTestToday();
    const canShowStats =
        testCount > 0 ||
        allResults.length > 0 ||
        (!canStartToday && dailyCompleted > 0);
    const statsButtonLabel = !canStartToday ? 'Проверка эффективности' : 'Моя статистика';

    return (
        <div className="App">
            {screen === 'start' && (
                <StartScreen
                    onStart={startTest}
                    testCount={testCount}
                    peakTime={peakTime}
                    onShowStats={showStats}
                    dailyCompleted={dailyCompleted}
                    dailyMax={getMaxTestsPerDay()}
                    canStartToday={canStartToday}
                    canShowStats={canShowStats}
                    statsButtonLabel={statsButtonLabel}
                    showDailyReset={!canStartToday}
                    onResetDailyLimit={resetDailyLimitAndSession}
                />
            )}
            {screen === 'test' && (
                <TestScreen
                    digits={currentDigits}
                    showDigits={timeLeft > 0}
                    memorizeTimeLeft={timeLeft}
                    inputValue={testInput}
                    onInputChange={setTestInput}
                    onSubmit={(digits) => {
                        const userDigits = digits.split('').map(Number);
                        let correct = 0;
                        for (let i = 0; i < 5; i++) {
                            if (userDigits[i] === currentDigits[i]) correct++;
                        }
                        completeTest(correct);
                    }}
                    onRepeat={repeatDigits}
                />
            )}
            {screen === 'result' && (
                <ResultScreen
                    score={lastScore}
                    total={5}
                    onRestart={restartTest}
                    showDailyReset={!canStartNewTestToday()}
                    onResetDailyLimit={resetDailyLimitAndSession}
                />
            )}
            {modal && (
                <InfoModal
                    title={modal.title}
                    text={modal.text}
                    onClose={closeModal}
                    onResetDailyLimit={!canStartNewTestToday() ? resetDailyLimitAndSession : undefined}
                />
            )}
        </div>
    );
}

export default App;