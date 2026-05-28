import { useCallback, useEffect, useMemo, useState } from 'react';
import { bandejasApi } from '../api/bandejas';
import { catalogosApi } from '../api/catalogos';
import {
    aplicarFiltrosSupervision,
    derivarDistribucion,
    derivarKpis,
    derivarRezagoInstituciones,
    mapDocumentoSupervisionRow,
    mergeDocumentosBandejas,
} from '../utils/certificacionSupervision';
import { fetchEducacionSuperiorMetricas } from '../lib/educacionSuperiorCache';
import { withTimeout } from '../lib/withTimeout';

/** Bandejas necesarias para KPIs y tabla (evita 7 peticiones paralelas que bloquean la UI). */
const BANDEJAS_CARGA = [
    'en-revision',
    'pendientes-revision',
    'aprobados',
    'listos-para-firma',
    'rechazados',
];

const PER_PAGE = 30;
const CARGA_TIMEOUT_MS = 22000;

export function useCertificacionSupervision() {
    const [resumen, setResumen] = useState({});
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [catalogos, setCatalogos] = useState({ instituciones: [], ciclos: [] });
    const [filters, setFilters] = useState({
        q: '',
        institucion_id: '',
        tipo_documento: '',
        fase: '',
        estatus: '',
        prioridad: '',
        ciclo_escolar_id: '',
    });

    const recargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [metricasEs, resumenBandejas, ...bandejas] = await withTimeout(
                Promise.all([
                    fetchEducacionSuperiorMetricas().catch(() => ({})),
                    bandejasApi.resumen().then((r) => r?.data ?? {}).catch(() => ({})),
                    ...BANDEJAS_CARGA.map((b) =>
                        bandejasApi
                            .listar(b, { per_page: PER_PAGE, page: 1 })
                            .then((r) => r?.data ?? [])
                            .catch(() => []),
                    ),
                ]),
                CARGA_TIMEOUT_MS,
            );

            const merged = mergeDocumentosBandejas(bandejas);
            const mapped = merged.map(mapDocumentoSupervisionRow);
            setResumen({ ...metricasEs, ...resumenBandejas });
            setRows(mapped);
        } catch (e) {
            setError(e?.message ?? 'No se pudo cargar la supervisión de certificación.');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void recargar();
    }, [recargar]);

    useEffect(() => {
        Promise.all([
            catalogosApi.instituciones().catch(() => ({ data: [] })),
            catalogosApi.ciclosEscolares().catch(() => ({ data: [] })),
        ]).then(([ins, cic]) => {
            setCatalogos({
                instituciones: Array.isArray(ins?.data) ? ins.data : [],
                ciclos: Array.isArray(cic?.data) ? cic.data : [],
            });
        });
    }, []);

    const rowsFiltradas = useMemo(() => aplicarFiltrosSupervision(rows, filters), [rows, filters]);

    const kpis = useMemo(() => derivarKpis(resumen, rows), [resumen, rows]);

    const distribucion = useMemo(() => derivarDistribucion(rowsFiltradas), [rowsFiltradas]);

    const rezago = useMemo(() => derivarRezagoInstituciones(rows), [rows]);

    const prioridades = useMemo(() => {
        const inc = rows.filter((r) => r.fase.key === 'incidencia').length;
        const sinFolio = rows.filter((r) => r.fase.key === 'pendiente_folio').length;
        const listos = rows.filter((r) => r.fase.key === 'listo_proceso_tecnico').length;
        const vencidos = rows.filter((r) => r.diasEspera >= 30 && r.fase.key !== 'firmado').length;

        return [
            { titulo: 'Expedientes con incidencia', total: inc, fase: 'incidencia' },
            { titulo: 'Pendientes de asignar folio', total: sinFolio, fase: 'pendiente_folio' },
            { titulo: 'Pendientes de proceso técnico', total: listos, fase: 'listo_proceso_tecnico' },
            { titulo: 'Documentos vencidos (+30 días)', total: vencidos, fase: '', prioridad: 'Alta' },
        ];
    }, [rows]);

    return {
        loading,
        error,
        resumen,
        rows,
        rowsFiltradas,
        kpis,
        distribucion,
        prioridades,
        rezago,
        catalogos,
        filters,
        setFilters,
        recargar,
    };
}
