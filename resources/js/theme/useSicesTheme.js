import { useSicesThemeInternal } from './SicesThemeProvider';

export function useSicesTheme() {
    const ctx = useSicesThemeInternal();
    if (!ctx) {
        throw new Error('useSicesTheme debe usarse dentro de SicesThemeProvider');
    }
    return ctx;
}
