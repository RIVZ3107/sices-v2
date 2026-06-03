import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const DEFAULT_FILTERS = {
    search: '',
    estatus: '',
    programa_id: '',
    plan_id: '',
    sede_id: '',
    periodo: '',
    expediente: '',
    sort_by: 'updated_at',
    sort_dir: 'desc',
    page: '1',
    per_page: '10',
};

function readFiltersFromParams(params) {
    const next = { ...DEFAULT_FILTERS };
    for (const key of Object.keys(DEFAULT_FILTERS)) {
        const v = params.get(key);
        if (v !== null && v !== '') {
            next[key] = v;
        }
    }
    return next;
}

export function useAlumnos() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicalDetail, setTechnicalDetail] = useState('');

    const filters = useMemo(() => readFiltersFromParams(searchParams), [searchParams]);

    const apiParams = useMemo(() => {
        const p = { ...filters, page: Number(filters.page) || 1, per_page: Number(filters.per_page) || 10 };
        Object.keys(p).forEach((k) => {
            if (p[k] === '' || p[k] === null) {
                delete p[k];
            }
        });
        return p;
    }, [filters]);

    const setFilters = useCallback(
        (patch, { resetPage = true } = {}) => {
            const next = { ...filters, ...patch };
            if (resetPage && !('page' in patch)) {
                next.page = '1';
            }
            const params = new URLSearchParams();
            Object.entries(next).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                    params.set(k, String(v));
                }
            });
            setSearchParams(params, { replace: true });
        },
        [filters, setSearchParams],
    );

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        setTechnicalDetail('');
        try {
            const res = await controlEscolarApi.alumnos(apiParams);
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError({
                message: sanitizeInstitutionalMessage(err?.message, 'No se pudo cargar la gestión de alumnos.'),
                status: err?.status ?? 500,
            });
            const detail = err?.original?.response?.data;
            setTechnicalDetail(
                detail ? JSON.stringify(detail, null, 2) : String(err?.original?.message ?? err?.message ?? ''),
            );
        } finally {
            setLoading(false);
        }
    }, [apiParams]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), filters.search?.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar, filters.search]);

    const limpiarFiltros = useCallback(() => {
        setSearchParams(new URLSearchParams({ per_page: filters.per_page || '10' }), { replace: true });
    }, [filters.per_page, setSearchParams]);

    return {
        payload,
        loading,
        error,
        technicalDetail,
        filters,
        setFilters,
        limpiarFiltros,
        recargar: cargar,
        metricas: payload?.metricas ?? null,
        catalogos: payload?.catalogos ?? { programas: [], planes: [], sedes: [], estatus: [] },
        permisos: payload?.permisos ?? {},
        rows: payload?.listado?.data ?? [],
        meta: payload?.listado?.meta ?? {},
        recientes: payload?.recientes ?? [],
        actualizadoEn: payload?.actualizado_en,
        apiOk: !error && payload !== null,
    };
}
