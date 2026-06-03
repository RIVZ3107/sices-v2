import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const DEFAULT = {
    search: '',
    estatus: '',
    periodo_id: '',
    programa_id: '',
    sede_id: '',
    motivo_bloqueo: '',
    con_adeudos: '',
    con_calificaciones_pendientes: '',
    con_observaciones: '',
    validacion_normativa_pendiente: '',
    fecha_desde: '',
    fecha_hasta: '',
    sort: 'updated_at',
    direction: 'desc',
    page: '1',
    per_page: '10',
};

function readParams(params) {
    const next = { ...DEFAULT };
    Object.keys(DEFAULT).forEach((k) => {
        const v = params.get(k);
        if (v) next[k] = v;
    });
    return next;
}

export function useReinscripciones() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicalDetail, setTechnicalDetail] = useState('');
    const [selected, setSelected] = useState([]);

    const filters = useMemo(() => readParams(searchParams), [searchParams]);

    const apiParams = useMemo(() => {
        const p = { ...filters, page: Number(filters.page) || 1, per_page: Number(filters.per_page) || 10 };
        Object.keys(p).forEach((k) => {
            if (p[k] === '' || p[k] == null) delete p[k];
        });
        return p;
    }, [filters]);

    const setFilters = useCallback(
        (patch, { resetPage = true } = {}) => {
            const next = { ...filters, ...patch };
            if (resetPage && !('page' in patch)) next.page = '1';
            const params = new URLSearchParams();
            Object.entries(next).forEach(([k, v]) => {
                if (v !== '' && v != null) params.set(k, String(v));
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
            const res = await controlEscolarApi.reinscripciones(apiParams);
            setPayload(res?.data ?? null);
            setSelected([]);
        } catch (err) {
            setPayload(null);
            setError({
                message: sanitizeInstitutionalMessage(err?.message, 'No se pudo cargar reinscripciones.'),
                status: err?.status ?? 500,
            });
            setTechnicalDetail(
                err?.original?.response?.data ? JSON.stringify(err.original.response.data, null, 2) : String(err?.message ?? ''),
            );
        } finally {
            setLoading(false);
        }
    }, [apiParams]);

    useEffect(() => {
        const delay = filters.search?.trim() ? 350 : 0;
        const t = setTimeout(() => void cargar(), delay);
        return () => clearTimeout(t);
    }, [cargar, searchParams]);

    const limpiarFiltros = useCallback(() => {
        setSearchParams(new URLSearchParams({ per_page: filters.per_page || '10' }), { replace: true });
    }, [filters.per_page, setSearchParams]);

    const toggleSelect = useCallback((id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }, []);

    const toggleAll = useCallback((ids) => {
        setSelected((prev) => (prev.length === ids.length ? [] : ids));
    }, []);

    return {
        payload,
        loading,
        error,
        technicalDetail,
        filters,
        setFilters,
        limpiarFiltros,
        recargar: cargar,
        selected,
        toggleSelect,
        toggleAll,
        metricas: payload?.metricas ?? null,
        catalogos: payload?.catalogos ?? {},
        rows: payload?.listado?.data ?? [],
        meta: payload?.listado?.meta ?? {},
        motivos: payload?.motivos_bloqueo ?? [],
        flujo: payload?.flujo ?? [],
        regla: payload?.regla_continuidad ?? '',
        actualizadoEn: payload?.actualizado_en,
        apiOk: !error && payload !== null,
    };
}
