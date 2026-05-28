import { useEffect, useState } from 'react';

/** Retrasa actualizaciones (p. ej. búsqueda en bandejas) para no disparar API en cada tecla. */
export function useDebouncedValue(value, delayMs = 400) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(id);
    }, [value, delayMs]);

    return debounced;
}
