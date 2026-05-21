import { useEffect, useState } from 'react';
import {
    fetchEducacionSuperiorMetricas,
    getEducacionSuperiorMetricasCached,
} from '../lib/educacionSuperiorCache';

/**
 * Métricas compartidas para pestañas de Educación Superior (caché ~90s entre navegaciones).
 */
export function useEducacionSuperiorMetricas() {
    const [metricas, setMetricas] = useState(() => getEducacionSuperiorMetricasCached() ?? {});
    const [loading, setLoading] = useState(() => getEducacionSuperiorMetricasCached() === null);

    useEffect(() => {
        let cancelled = false;

        fetchEducacionSuperiorMetricas()
            .then((data) => {
                if (!cancelled) {
                    setMetricas(data);
                }
            })
            .catch(() => {
                if (!cancelled && getEducacionSuperiorMetricasCached() === null) {
                    setMetricas({});
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { metricas, loading };
}
