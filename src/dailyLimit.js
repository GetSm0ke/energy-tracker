const STORAGE_KEY = 'energy-tracker-daily-v1';

export function todayLocalKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function getMaxTestsPerDay() {
    const raw = process.env.REACT_APP_MAX_TESTS_PER_DAY;
    const n = raw != null && raw !== '' ? parseInt(raw, 10) : 5;
    return Number.isFinite(n) && n > 0 ? n : 5;
}

export function loadDailyCompletedCount() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const today = todayLocalKey();
        if (!raw) return { dateKey: today, count: 0 };
        const data = JSON.parse(raw);
        if (!data || data.date !== today) return { dateKey: today, count: 0 };
        const count = typeof data.count === 'number' && data.count >= 0 ? data.count : 0;
        return { dateKey: today, count };
    } catch {
        return { dateKey: todayLocalKey(), count: 0 };
    }
}

export function recordCompletedTest() {
    const today = todayLocalKey();
    const { count } = loadDailyCompletedCount();
    const next = count + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: next }));
    return next;
}

export function canStartNewTestToday() {
    return loadDailyCompletedCount().count < getMaxTestsPerDay();
}

/** Сброс счётчика попыток за текущий календарный день (локально в браузере). */
export function clearDailyCompletedCount() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}
