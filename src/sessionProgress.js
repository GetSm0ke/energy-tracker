import { todayLocalKey } from './dailyLimit';

const PROGRESS_KEY = 'energy-tracker-progress-v1';

/**
 * Сохраняет серию тестов и пик за календарный день, чтобы при исчерпанном лимите
 * можно было снова открыть статистику после перезагрузки страницы.
 */
export function loadSessionProgress() {
    try {
        const today = todayLocalKey();
        const raw = localStorage.getItem(PROGRESS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || data.date !== today) return null;
        return {
            allResults: Array.isArray(data.allResults) ? data.allResults : [],
            testCount: typeof data.testCount === 'number' && data.testCount >= 0 ? data.testCount : 0,
            peakTime: data.peakTime != null ? data.peakTime : null,
        };
    } catch {
        return null;
    }
}

export function saveSessionProgress({ allResults, testCount, peakTime }) {
    try {
        const payload = {
            date: todayLocalKey(),
            allResults,
            testCount,
            peakTime,
        };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload));
    } catch {
        /* ignore quota / private mode */
    }
}

export function clearSessionProgress() {
    try {
        localStorage.removeItem(PROGRESS_KEY);
    } catch {
        /* ignore */
    }
}
