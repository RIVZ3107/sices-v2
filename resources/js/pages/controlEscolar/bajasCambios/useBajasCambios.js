import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const DEFAULT = {
    search: '', estatus: '', tipo_cambio: '', etapa: '', prioridad: '', motivo: '',
    periodo_id: '', programa_id: '', fecha_desde: '', fecha_hasta: '',
    vencidas: '', criticas: '', con_observaciones: '', documentos_pendientes: '',
    page: '1', per_page: '10', sort: 'updated_at', direction: 'desc',
};

function readParams(params) {
    const next = { ...DEFAULT };
    Object.keys(DEFAULT).forEach((k) => { const v = params.get(k); if (v) next[k] = v; });
    return next;
}

export function useBajasCambios() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [indexData, setIndexData] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [flujo, setFlujo] = useState(null);
    const [riesgo, setRiesgo] = useState(null);
    const [motivos, setMotivos] = useState([]);
    const [recientes, setRecientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicalDetail, setTechnicalDetail] = useState('');
    const [selected, setSelected] = useState([]);
    const [draftFilters, setDraftFilters] = useState(null);

    const filters = useMemo(() => readParams(searchParams), [searchParams]);
    const draft = draftFilters ?? filters;

    const apiParams = useMemo(() => {
        const p = { ...filters, page: Number(filters.page) || 1, per_page: Number(filters.per_page) || 10 };
        Object.keys(p).forEach((k) => { if (p[k] === '' || p[k] == null) delete p[k]; });
        return p;
    }, [filters]);

    const setFilters = useCallback((patch, { resetPage = true } = {}) => {
        const next = { ...filters, ...patch };
        if (resetPage && !('page' in patch)) next.page = '1';
        const params = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => { if (v !== '' && v != null) params.set(k, String(v)); });
        setSearchParams(params, { replace: true });
        setDraftFilters(null);
    }, [filters, setSearchParams]);

    const setDraft = useCallback((patch) => setDraftFilters((prev) => ({ ...(prev ?? filters), ...patch })), [filters]);
    const aplicarFiltros = useCallback(() => { if (draftFilters) setFilters(draftFilters); }, [draftFilters, setFilters]);
    const limpiarFiltros = useCallback(() => {
        setDraftFilters(null);
        setSearchParams(new URLSearchParams({ per_page: filters.per_page || '10' }), { replace: true });
    }, [filters.per_page, setSearchParams]);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        setTechnicalDetail('');
        try {
            const [idx, res, flu, rie, mot, rec] = await Promise.all([
                controlEscolarApi.bajasCambiosIndex(apiParams),
                controlEscolarApi.bajasCambiosResumen(apiParams),
                controlEscolarApi.bajasCambiosFlujo(),
                controlEscolarApi.bajasCambiosRiesgo(),
                controlEscolarApi.bajasCambiosMotivos(),
                controlEscolarApi.bajasCambiosRecientes(),
            ]);
            setIndexData(idx?.data ?? null);
            setResumen(res?.data ?? null);
            setFlujo(flu?.data ?? null);
            setRiesgo(rie?.data ?? null);
            setMotivos(mot?.data ?? []);
            setRecientes(rec?.data ?? []);
            setSelected([]);
        } catch (err) {
            setIndexData(null);
            setError({ message: sanitizeInstitutionalMessage(err?.message, 'No se pudo cargar bajas y cambios.'), status: err?.status ?? 500 });
            setTechnicalDetail(err?.original?.response?.data ? JSON.stringify(err.original.response.data, null, 2) : '');
        } finally {
            setLoading(false);
        }
    }, [apiParams]);

    useEffect(() => {
        const delay = filters.search?.trim() ? 350 : 0;
        const t = setTimeout(() => void cargar(), delay);
        return () => clearTimeout(t);
    }, [cargar, searchParams]);

    const toggleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    const toggleAll = (ids) => setSelected((prev) => (prev.length === ids.length ? [] : ids));

    return {
        loading, error, technicalDetail, filters, draft, setFilters, setDraft, aplicarFiltros, limpiarFiltros,
        recargar: cargar, rows: indexData?.data ?? [], meta: indexData?.meta ?? {},
        resumen, flujo, riesgo, motivos, recientes, actualizadoEn: indexData?.actualizado_en ?? resumen?.ultima_actualizacion,
        selected, toggleSelect, toggleAll,
    };
}
