import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const DEFAULT = {
    search: '',
    estatus: '',
    con_pendientes: '',
    con_correcciones: '',
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

export function useCalificaciones() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [indexData, setIndexData] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [avance, setAvance] = useState(null);
    const [pendientes, setPendientes] = useState(null);
    const [fechas, setFechas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicalDetail, setTechnicalDetail] = useState('');
    const [selected, setSelected] = useState([]);

    const filters = useMemo(() => readParams(searchParams), [searchParams]);

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
    }, [filters, setSearchParams]);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        setTechnicalDetail('');
        try {
            const [idx, res, av, pen, fec] = await Promise.all([
                controlEscolarApi.calificaciones(apiParams),
                controlEscolarApi.calificacionesResumen(apiParams),
                controlEscolarApi.calificacionesAvance(),
                controlEscolarApi.calificacionesPendientes(),
                controlEscolarApi.calificacionesFechas(),
            ]);
            setIndexData(idx?.data ?? null);
            setResumen(res?.data ?? null);
            setAvance(av?.data ?? null);
            setPendientes(pen?.data ?? null);
            setFechas(fec?.data ?? []);
            setSelected([]);
        } catch (err) {
            setIndexData(null);
            setError({
                message: sanitizeInstitutionalMessage(err?.message, 'No se pudo cargar calificaciones.'),
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

    const limpiarFiltros = useCallback(() => {
        setSearchParams(new URLSearchParams({ per_page: filters.per_page || '10' }), { replace: true });
    }, [filters.per_page, setSearchParams]);

    const rows = indexData?.data ?? [];
    const meta = indexData?.meta ?? {};
    const ventana = indexData?.ventana ?? { abierta: true };

    return {
        loading, error, technicalDetail, filters, setFilters, limpiarFiltros, recargar: cargar,
        rows, meta, resumen, avance, pendientes, fechas, ventana,
        aviso: indexData?.aviso_institucional,
        actualizadoEn: indexData?.actualizado_en ?? resumen?.ultima_actualizacion,
        selected, setSelected,
        toggleSelect: (key) => setSelected((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key])),
        toggleAll: () => setSelected((p) => (p.length === rows.length ? [] : rows.map((r) => r.grupo_materia_key))),
    };
}
