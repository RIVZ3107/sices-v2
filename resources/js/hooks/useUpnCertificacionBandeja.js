import { useCallback, useEffect, useMemo, useState } from 'react';
import { bandejasApi } from '../api/bandejas';
import { catalogosApi } from '../api/catalogos';
import { useDebouncedValue } from './useDebouncedValue';
import { withTimeout } from '../lib/withTimeout';
import {
    UPN_BANDEJAS_DEFAULT,
    UPN_ESTATUS_BANDEJAS,
    UPN_SUBSISTEMA_CLAVE,
    buildBandejaApiParams,
    mapFilaUpn,
    pasaFiltrosClienteUpn,
} from '../utils/upnCertificacion';

export const UPN_FILTROS_INICIALES = {
    institucion_id: '',
    sede_id: '',
    estatus: '',
    tipo_documento: '',
    tipo_certificacion: '',
    programa_id: '',
    ciclo_escolar_id: '',
    folio: '',
    curp: '',
    nombre: '',
    matricula: '',
    q: '',
    fecha_expedicion_desde: '',
    fecha_expedicion_hasta: '',
};

const CARGA_TIMEOUT_MS = 22000;
const PER_PAGE = 40;

function bandejasParaFiltro(estatus) {
    if (estatus && UPN_ESTATUS_BANDEJAS[estatus]) {
        return UPN_ESTATUS_BANDEJAS[estatus];
    }
    return UPN_BANDEJAS_DEFAULT;
}

async function fetchBandejaUpn(bandeja, params) {
    try {
        const res = await bandejasApi.listar(bandeja, params);
        return Array.isArray(res?.data) ? res.data : [];
    } catch {
        return [];
    }
}

export function useUpnCertificacionBandeja() {
    const [filters, setFilters] = useState(UPN_FILTROS_INICIALES);
    const filtersDebounced = useDebouncedValue(filters, 400);
    const [catalogosLoading, setCatalogosLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rowsRaw, setRowsRaw] = useState([]);
    const [catalogos, setCatalogos] = useState({
        subsistemaUpnId: null,
        instituciones: [],
        sedes: [],
        programas: [],
        ciclos: [],
    });

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setCatalogosLoading(true);
            try {
                const subsRes = await catalogosApi.subsistemas();
                const subs = Array.isArray(subsRes?.data) ? subsRes.data : [];
                const upn = subs.find((s) => String(s.clave ?? '').toUpperCase() === UPN_SUBSISTEMA_CLAVE);
                const upnId = upn?.id ?? null;

                const instParams = upnId ? { subsistema_id: upnId } : { subsistema: UPN_SUBSISTEMA_CLAVE };

                const [ins, cic, prog] = await Promise.all([
                    catalogosApi.instituciones(instParams).catch(() => ({ data: [] })),
                    catalogosApi.ciclosEscolares().catch(() => ({ data: [] })),
                    catalogosApi.programas(upnId ? { subsistema_id: upnId } : {}).catch(() => ({ data: [] })),
                ]);

                if (!cancelled) {
                    setCatalogos({
                        subsistemaUpnId: upnId,
                        instituciones: Array.isArray(ins?.data) ? ins.data : [],
                        sedes: [],
                        programas: Array.isArray(prog?.data) ? prog.data : [],
                        ciclos: Array.isArray(cic?.data) ? cic.data : [],
                    });
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e?.message ?? 'No se pudieron cargar catálogos UPN.');
                }
            } finally {
                if (!cancelled) {
                    setCatalogosLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!filters.institucion_id) {
            setCatalogos((c) => ({ ...c, sedes: [] }));
            return;
        }
        const upnId = catalogos.subsistemaUpnId;
        let cancelled = false;

        catalogosApi
            .sedes({
                institucion_id: filters.institucion_id,
                ...(upnId ? { subsistema_id: upnId } : {}),
            })
            .then((res) => {
                if (!cancelled) {
                    setCatalogos((c) => ({
                        ...c,
                        sedes: Array.isArray(res?.data) ? res.data : [],
                    }));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCatalogos((c) => ({ ...c, sedes: [] }));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [filters.institucion_id, catalogos.subsistemaUpnId]);

    const cargarBandeja = useCallback(async () => {
        setLoading(true);
        setError('');

        let bandejas = bandejasParaFiltro(filtersDebounced.estatus);
        if (filtersDebounced.estatus && ['firmado', 'error_firma', 'cancelado'].includes(filtersDebounced.estatus)) {
            bandejas = UPN_ESTATUS_BANDEJAS[filtersDebounced.estatus] ?? bandejas;
        }

        const params = {
            ...buildBandejaApiParams(filtersDebounced, catalogos.subsistemaUpnId),
            per_page: PER_PAGE,
        };

        try {
            const results = await withTimeout(
                Promise.all(bandejas.map((b) => fetchBandejaUpn(b, params))),
                CARGA_TIMEOUT_MS,
                'No se pudo cargar la certificación UPN.',
            );

            const byId = new Map();
            results.flat().forEach((row) => {
                if (row?.id != null) {
                    byId.set(row.id, row);
                }
            });
            setRowsRaw([...byId.values()]);
        } catch (e) {
            setRowsRaw([]);
            setError(e?.message ?? 'No se pudo cargar la certificación UPN.');
        } finally {
            setLoading(false);
        }
    }, [filtersDebounced, catalogos.subsistemaUpnId]);

    useEffect(() => {
        if (catalogosLoading) {
            return;
        }
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            const bandejas = bandejasParaFiltro(filtersDebounced.estatus);
            const params = {
                ...buildBandejaApiParams(filtersDebounced, catalogos.subsistemaUpnId),
                per_page: PER_PAGE,
            };

            try {
                const results = await withTimeout(
                    Promise.all(bandejas.map((b) => fetchBandejaUpn(b, params))),
                    CARGA_TIMEOUT_MS,
                    'No se pudo cargar la certificación UPN.',
                );
                if (cancelled) return;

                const byId = new Map();
                results.flat().forEach((row) => {
                    if (row?.id != null) {
                        byId.set(row.id, row);
                    }
                });
                setRowsRaw([...byId.values()]);
            } catch (e) {
                if (!cancelled) {
                    setRowsRaw([]);
                    setError(e?.message ?? 'No se pudo cargar la certificación UPN.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [catalogosLoading, filtersDebounced, catalogos.subsistemaUpnId]);

    const rowsFiltradas = useMemo(() => {
        const prog = filtersDebounced.programa_id
            ? catalogos.programas.find((p) => String(p.id) === String(filtersDebounced.programa_id))
            : null;
        const filtersWithProg = {
            ...filtersDebounced,
            programa_nombre: prog?.nombre ?? '',
        };
        let list = rowsRaw.map((r, i) => mapFilaUpn(r, i));
        list = list.filter((r) => pasaFiltrosClienteUpn(r, filtersWithProg));
        return list;
    }, [rowsRaw, filtersDebounced, catalogos.programas]);

    const limpiarFiltros = useCallback(() => {
        setFilters({ ...UPN_FILTROS_INICIALES });
    }, []);

    const busy = catalogosLoading || loading;

    return {
        loading: busy,
        catalogosLoading,
        bandejaLoading: loading,
        error,
        filters,
        setFilters,
        catalogos,
        rowsFiltradas,
        recargar: cargarBandeja,
        limpiarFiltros,
        filtrosIniciales: UPN_FILTROS_INICIALES,
    };
}
