import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bandejasApi } from '../../api/bandejas';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { withTimeout } from '../../lib/withTimeout';
import { documentoProcesoTecnicoDetallePath } from '../../utils/certificacionRoutes';
import { BANDEJAS_INCIDENCIAS, mapFilaIncidencia } from '../../utils/incidenciasTecnicas';
import { PROC_TEC_PERM } from '../../utils/procesoTecnicoPermissions';
import { InstitutionalBandejaActions, ejecutarAccionBandeja } from '../../components/bandeja/InstitutionalBandejaActions';
import { EMPTY_BANDEJA } from '../../utils/bandejaWorkflow';

const TABS = Object.values(BANDEJAS_INCIDENCIAS);
const CARGA_TIMEOUT_MS = 22000;

export function ProcesoTecnicoCertificacionPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabIni = searchParams.get('tab') ?? 'abiertas';
    const [tab, setTab] = useState(tabIni);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        setTab(searchParams.get('tab') ?? 'abiertas');
    }, [searchParams]);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        const conf = TABS.find((t) => t.key === tab) ?? TABS[0];
        try {
            const res = await withTimeout(
                bandejasApi.listar(conf.api, { per_page: 50 }),
                CARGA_TIMEOUT_MS,
                'No fue posible cargar la bandeja técnica.',
            );
            const data = Array.isArray(res?.data) ? res.data : [];
            setRows(data.map(mapFilaIncidencia));
        } catch (e) {
            setRows([]);
            setError(e?.message ?? 'No fue posible cargar la bandeja técnica.');
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    function cambiarTab(key) {
        setTab(key);
        setSearchParams({ tab: key });
    }

    const meta = TABS.find((t) => t.key === tab);

    return (
        <RequirePermission anyOf={PROC_TEC_PERM.verBandeja}>
            <section className="grid gap-4">
                <PageHeader
                    title="Incidencias técnicas de certificación"
                    subtitle="Monitoreo, diagnóstico y atención de errores técnicos generados durante el procesamiento automático de certificados. El flujo normal lo completa Educación Superior; Sistemas interviene solo ante fallas."
                />

                <nav className="flex flex-wrap gap-2" aria-label="Bandejas de incidencias">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            className={tab === t.key ? 'inst-btn inst-btn-primary text-sm' : 'inst-btn inst-btn-secondary text-sm'}
                            onClick={() => cambiarTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                <p className="text-sm text-slate-600">
                    {meta?.label ?? ''} · {loading ? '…' : rows.length} registro(s)
                </p>

                {error ? (
                    <div className="inst-surface p-6 text-center grid gap-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <button type="button" className="inst-btn inst-btn-primary text-sm mx-auto" onClick={() => void cargar()}>
                            Reintentar
                        </button>
                    </div>
                ) : null}

                {loading && !error ? <LoadingState text="Cargando incidencias técnicas…" /> : null}

                {!loading && !error && rows.length === 0 ? (
                    <div className="inst-surface p-8 text-center grid gap-2">
                        <h2 className="text-base font-semibold text-slate-900">Sin incidencias en esta bandeja</h2>
                        <p className="text-sm text-slate-600 max-w-lg mx-auto">{EMPTY_BANDEJA.sistemas}</p>
                    </div>
                ) : null}

                {!loading && !error && rows.length > 0 ? (
                    <div className="overflow-x-auto inst-surface">
                        <table className="inst-table min-w-full text-sm">
                            <thead className="text-left">
                                <tr>
                                    <th className="px-3 py-2">Documento</th>
                                    <th className="px-3 py-2">Alumno</th>
                                    <th className="px-3 py-2">CURP</th>
                                    <th className="px-3 py-2">Institución</th>
                                    <th className="px-3 py-2">Folio</th>
                                    <th className="px-3 py-2">Etapa fallo</th>
                                    <th className="px-3 py-2">Tipo error</th>
                                    <th className="px-3 py-2">Último intento</th>
                                    <th className="px-3 py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2">#{row.id}</td>
                                        <td className="px-3 py-2">{row.alumno}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{row.curp}</td>
                                        <td className="px-3 py-2">{row.institucion}</td>
                                        <td className="px-3 py-2">{row.folio}</td>
                                        <td className="px-3 py-2">{row.etapa}</td>
                                        <td className="px-3 py-2 text-xs text-red-800 max-w-[200px] truncate" title={String(row.tipoError)}>
                                            {String(row.tipoError).slice(0, 80)}
                                        </td>
                                        <td className="px-3 py-2 text-xs">
                                            {row.ultimoIntento ? new Date(row.ultimoIntento).toLocaleString('es-MX') : '—'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <InstitutionalBandejaActions
                                                row={{
                                                    id: row.id,
                                                    workflow_resumen: row.workflow_resumen,
                                                    ultimo_movimiento: row.ultimoIntento,
                                                }}
                                                busy={busyId === row.id}
                                                onAccion={async (accion) => {
                                                    if (accion.requiere_motivo) {
                                                        const motivo = window.prompt(`Motivo:`, '');
                                                        if (motivo === null || !motivo.trim()) return;
                                                        setBusyId(row.id);
                                                        try {
                                                            await ejecutarAccionBandeja(
                                                                accion.accion,
                                                                row.id,
                                                                motivo.trim(),
                                                            );
                                                            await cargar();
                                                        } finally {
                                                            setBusyId(null);
                                                        }
                                                        return;
                                                    }
                                                    setBusyId(row.id);
                                                    try {
                                                        await ejecutarAccionBandeja(
                                                            accion.accion,
                                                            row.id,
                                                            accion.label,
                                                        );
                                                        await cargar();
                                                    } finally {
                                                        setBusyId(null);
                                                    }
                                                }}
                                            />
                                            <Link
                                                to={documentoProcesoTecnicoDetallePath(row.id)}
                                                className="inst-btn inst-btn-primary text-xs ml-1"
                                            >
                                                Diagnóstico
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>
        </RequirePermission>
    );
}
