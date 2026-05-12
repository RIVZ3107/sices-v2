import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken } from '../authStore';
import { fetchMeApariencia } from '../api/apariencia';
import { applyCssVariables, clearInlineThemeVariables } from './applyCssVariables';

const SicesThemeContext = createContext(null);

export function SicesThemeProvider({ children }) {
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        const token = getToken();
        if (!token) {
            clearInlineThemeVariables();
            setTheme(null);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetchMeApariencia();
            const data = res?.data?.data ?? null;
            setTheme(data);
            applyCssVariables(data);
        } catch (e) {
            setError(e);
            clearInlineThemeVariables();
            setTheme(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const onStorage = (ev) => {
            if (ev.key === 'sices_token') {
                void refresh();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [refresh]);

    const value = useMemo(
        () => ({
            theme,
            loading,
            error,
            refreshTheme: refresh,
        }),
        [theme, loading, error, refresh],
    );

    return <SicesThemeContext.Provider value={value}>{children}</SicesThemeContext.Provider>;
}

export function useSicesThemeInternal() {
    return useContext(SicesThemeContext);
}
