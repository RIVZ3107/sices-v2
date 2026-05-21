import { educacionSuperiorApi } from '../api/educacionSuperior';

const TTL_MS = 90_000;

let metricasCache = null;
let metricasCachedAt = 0;
let metricasInflight = null;

const catalogCache = new Map();

/**
 * Métricas ligeras (bandejas + conteos de catálogo). Una sola petición compartida entre pestañas ES.
 */
export function fetchEducacionSuperiorMetricas({ force = false } = {}) {
    const fresh = metricasCache && Date.now() - metricasCachedAt < TTL_MS;
    if (!force && fresh) {
        return Promise.resolve(metricasCache);
    }

    if (!force && metricasInflight) {
        return metricasInflight;
    }

    metricasInflight = educacionSuperiorApi
        .metricas()
        .then((res) => {
            metricasCache = res?.data ?? {};
            metricasCachedAt = Date.now();
            return metricasCache;
        })
        .catch((err) => {
            metricasInflight = null;
            throw err;
        })
        .finally(() => {
            metricasInflight = null;
        });

    return metricasInflight;
}

export function getEducacionSuperiorMetricasCached() {
    if (metricasCache && Date.now() - metricasCachedAt < TTL_MS) {
        return metricasCache;
    }
    return null;
}

export function invalidateEducacionSuperiorMetricas() {
    metricasCache = null;
    metricasCachedAt = 0;
}

/**
 * Catálogos con caché corta al navegar entre pestañas del mismo módulo.
 */
export function fetchEducacionSuperiorCatalog(catalogKey, fetcher, { force = false } = {}) {
    const entry = catalogCache.get(catalogKey);
    const fresh = entry && Date.now() - entry.at < TTL_MS;

    if (!force && fresh) {
        return Promise.resolve(entry.data);
    }

    if (!force && entry?.inflight) {
        return entry.inflight;
    }

    const inflight = Promise.resolve(fetcher())
        .then((data) => {
            catalogCache.set(catalogKey, { data, at: Date.now(), inflight: null });
            return data;
        })
        .catch((err) => {
            const current = catalogCache.get(catalogKey);
            if (current?.inflight === inflight) {
                catalogCache.delete(catalogKey);
            }
            throw err;
        });

    catalogCache.set(catalogKey, {
        data: entry?.data ?? null,
        at: entry?.at ?? 0,
        inflight,
    });

    return inflight;
}
