import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';
import { buildQueryParamsFromFilters } from './documentoUx';

const DEFAULT = {
    search: '',
    estatus: '',
    periodo_id: '',
    tipo_documento_id: '',
    programa_id: '',
    sede_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    solo_mis_solicitudes: '',
    con_observaciones: '',
    a_punto_de_vencer: '',
    requiere_correccion: '',
    page: '1',
    per_page: '10',
    sort: 'updated_at',
    direction: 'desc',
};

function readParams(params) {
    const next = { ...DEFAULT };
    Object.keys(DEFAULT).forEach((k) => {
        const v = params.get(k);
        if (v) next[k] = v;
    });
    return next;
}

export function useDocumentosEscolares() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [indexData, setIndexData] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [pendientes, setPendientes] = useState(null);
    const [fechas, setFechas] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicalDetail, setTechnicalDetail] = useState('');
    const [draftFilters, setDraftFilters] = useState(null);

    const filters = useMemo(() => readParams(searchParams), [searchParams]);
    const draft = draftFilters ?? filters;

    const apiParams = useMemo(() => buildQueryParamsFromFilters({
        ...filters,
        page: Number(filters.page) || 1,
        per_page: Number(filters.per_page) || 10,
    }), [filters]);

    const setFilters = useCallback((patch, { resetPage = true } = {}) => {
        const next = { ...filters, ...patch };
        if (resetPage && !('page' in patch)) next.page = '1';
        const params = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => {
            if (v !== '' && v != null && v !== false) params.set(k, String(v));
        });
        setSearchParams(params, { replace: true });
        setDraftFilters(null);
    }, [filters, setSearchParams]);

    const setDraft = useCallback((patch) => {
        setDraftFilters((prev) => ({ ...(prev ?? filters), ...patch }));
    }, [filters]);

    const aplicarFiltros = useCallback(() => {
        if (draftFilters) setFilters(draftFilters, { resetPage: true });
    }, [draftFilters, setFilters]);

    const limpiarFiltros = useCallback(() => {
        setDraftFilters(null);
        setSearchParams(new URLSearchParams({ per_page: filters.per_page || '10' }), { replace: true });
    }, [filters.per_page, setSearchParams]);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        setTechnicalDetail('');
        try {
            const [idx, res, pen, fec, tip] = await Promise.all([
                controlEscolarApi.documentosIndex(apiParams),
                controlEscolarApi.documentosResumen(apiParams),
                controlEscolarApi.documentosPendientes(),
                controlEscolarApi.documentosFechas(),
                controlEscolarApi.documentosTiposAutorizados(),
            ]);
            setIndexData(idx?.data ?? null);
            setResumen(res?.data ?? null);
            setPendientes(pen?.data ?? null);
            setFechas(fec?.data ?? []);
            setTipos(tip?.data ?? []);
        } catch (err) {
            setIndexData(null);
            setError({
                message: sanitizeInstitutionalMessage(err?.message, 'No se pudo cargar los documentos escolares.'),
                status: err?.status ?? 500,
            });
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

    const rows = indexData?.data ?? [];
    const meta = indexData?.meta ?? {};

    return {
        loading,
        error,
        technicalDetail,
        filters,
        draft,
        setFilters,
        setDraft,
        aplicarFiltros,
        limpiarFiltros,
        recargar: cargar,
        rows,
        meta,
        resumen,
        pendientes,
        fechas,
        tipos,
        aviso: indexData?.aviso_institucional,
        actualizadoEn: indexData?.actualizado_en ?? resumen?.ultima_actualizacion,
    };
}
