import { useEffect, useMemo, useState } from 'react';
import { getUser } from '../../authStore';
import { catalogosApi } from '../../api/catalogos';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';
import { AlertBox } from '../../components/ui/AlertBox';
import { ModuleHeader } from '../../components/ui/ModuleHeader';

export function CatalogosPage() {
    const user = getUser();
    const puedeVerLegacy = (user?.permissions ?? []).includes('ver_claves_legacy_catalogos');
    const [sedes, setSedes] = useState([]);
    const [loadingSedes, setLoadingSedes] = useState(false);
    const [errorSedes, setErrorSedes] = useState('');
    const [openLegacy, setOpenLegacy] = useState({});

    useEffect(() => {
        let cancelled = false;
        setLoadingSedes(true);
        setErrorSedes('');
        catalogosApi
            .sedes({ estatus: 'A' })
            .then((res) => {
                if (cancelled) return;
                setSedes(Array.isArray(res?.data) ? res.data : []);
            })
            .catch((e) => {
                if (cancelled) return;
                setErrorSedes(e?.message ?? 'No fue posible cargar sedes.');
                setSedes([]);
            })
            .finally(() => {
                if (! cancelled) setLoadingSedes(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const sedesConLegacy = useMemo(() => sedes.filter((s) => s?.legacy_kcve_subsede), [sedes]);

    return (
        <DashboardShell>
            <ModuleHeader title="Catálogos institucionales" subtitle="Consulta y gobierno de catálogos maestros del sistema." />
            <DashboardInstitutionalNotice type="info" message="Catalogos administrativos en preparacion. Se habilitaran con endpoints de gestion dedicados." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard title="Catalogos activos" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Catalogos pendientes" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Ultima actualizacion" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Version catalogos" value={0} subtitle="Informacion no disponible" />
            </div>
            <DashboardQuickActions
                title="Navegacion rapida"
                actions={[
                    { label: 'Dashboard admin', to: '/app/admin/dashboard' },
                    { label: 'Usuarios y roles', to: '/app/admin/usuarios-roles' },
                    { label: 'Reportes basicos', to: '/app/admin/reportes-basicos' },
                    { label: 'Parametros', to: '/app/admin/parametros' },
                ]}
            />
            <DashboardStatusOverview
                title="Estado de catalogos"
                items={[
                    { label: 'Institucionales', value: 'Operativo parcial' },
                    { label: 'Academicos', value: 'Operativo parcial' },
                    { label: 'Administrativos', value: 'Pendiente backend' },
                ]}
            />
            <DashboardModuleGrid
                title="Funciones previstas"
                modules={[
                    { name: 'Versionado de catalogos', description: 'Control de versiones y vigencias.', status: 'Pendiente backend' },
                    { name: 'Publicacion controlada', description: 'Flujo de cambios con validacion.', status: 'Pendiente backend' },
                    { name: 'Trazabilidad de modificaciones', description: 'Bitacora institucional de cambios.', status: 'Pendiente backend' },
                    { name: 'Dependencias academicas', description: 'Validacion de consistencia entre catalogos.', status: 'Pendiente backend' },
                ]}
            />
            <section className="inst-surface p-4">
                <h3 className="font-semibold text-slate-900">Catálogo avanzado de sedes/subsedes</h3>
                <p className="text-xs text-slate-600 mt-1">Vista operativa sin claves legacy para Control Escolar y directivos.</p>
                {errorSedes ? <AlertBox type="warning" message={errorSedes} /> : null}
                {loadingSedes ? <p className="text-sm text-slate-600 mt-3">Cargando sedes...</p> : null}
                {!loadingSedes ? (
                    <div className="overflow-x-auto mt-3">
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left">Sede/Subsede</th>
                                    <th className="px-3 py-2 text-left">Institución</th>
                                    <th className="px-3 py-2 text-left">Subsistema</th>
                                    <th className="px-3 py-2 text-left">CCT oficial</th>
                                    <th className="px-3 py-2 text-left">Estatus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sedes.slice(0, 30).map((s) => (
                                    <tr key={s.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2">{s.nombre}</td>
                                        <td className="px-3 py-2">{s.institucion ?? '—'}</td>
                                        <td className="px-3 py-2">{s.subsistema ?? '—'}</td>
                                        <td className="px-3 py-2">{s.cct ?? '—'}</td>
                                        <td className="px-3 py-2">{s.estatus ?? 'A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
                {puedeVerLegacy ? (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-900">Referencias legacy</h4>
                        <p className="text-xs text-slate-600 mt-1">Visible solo para perfiles técnicos autorizados.</p>
                        <div className="mt-2 grid gap-2">
                            {sedesConLegacy.slice(0, 20).map((s) => (
                                <details
                                    key={`legacy-${s.id}`}
                                    open={openLegacy[s.id] === true}
                                    onToggle={(e) => setOpenLegacy((prev) => ({ ...prev, [s.id]: e.currentTarget.open }))}
                                    className="rounded border border-slate-200 p-2"
                                >
                                    <summary className="cursor-pointer text-xs font-medium text-slate-800">
                                        {s.nombre}
                                    </summary>
                                    <div className="mt-2 text-xs text-slate-700">
                                        <p><strong>kcve_subsede:</strong> {s.legacy_kcve_subsede ?? '—'}</p>
                                        <p><strong>rcve_institucion:</strong> {s.legacy_rcve_institucion ?? '—'}</p>
                                        <p><strong>rcvect:</strong> {s.legacy_rcvect ?? '—'}</p>
                                        <p><strong>origen:</strong> {s?.metadata?.origen ?? '—'}</p>
                                        <p><strong>fecha registro legacy:</strong> {s?.metadata?.legacy?.ifecreg ?? '—'}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>
        </DashboardShell>
    );
}
