import { useEffect, useState } from 'react';
import { bandejasApi } from '../../api/bandejas';

export function useDashboardResumen() {
    const [resumen, setResumen] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        bandejasApi.resumen()
            .then((res) => setResumen(res?.data ?? {}))
            .catch((err) => {
                setResumen({});
                setError(err?.message ?? 'No se pudo cargar el resumen de indicadores.');
            });
    }, []);

    return { resumen, error };
}
