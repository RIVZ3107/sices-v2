import { Link } from 'react-router-dom';
import { getUser } from '../../authStore';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { CeInstSurface, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_NOTIFICACIONES } from '../../data/controlEscolarDemoData';
import { DireccionNotificacionesPage } from '../direccion/DireccionNotificacionesPage';

const CATEGORIAS = [
    'Académicas',
    'Administrativas',
    'Documentos',
    'Sistema',
    'Inscripciones',
    'Reinscripciones',
    'Solicitudes',
    'Observaciones',
    'Importaciones',
];

export function NotificacionesCePage() {
    const roles = getUser()?.roles ?? [];
    if (!roles.includes('control_escolar_escuela')) {
        const esDirector = roles.includes('director_escuela');
        if (esDirector) {
            return <DireccionNotificacionesPage />;
        }
        const esEducacionSuperior = roles.includes('educacion_superior');
        const subtitle = esEducacionSuperior
                ? 'Centro de avisos para Educación Superior: lectura, archivo, respuesta y apertura del trámite relacionado. Preferencias personales únicamente; sin reglas globales del sistema.'
                : 'Centro de avisos operativos. No incluye administración de categorías globales ni alertas técnicas del sistema.';

        return (
            <section className="grid gap-4">
                <PageHeader title="Notificaciones" subtitle={subtitle} />
                <SectionCard title="Bandeja">
                    <p className="text-sm text-slate-700">
                        Las notificaciones en tiempo real se integrarán con el motor de avisos institucional. Mientras tanto, use el icono de campana en la barra superior o abra el expediente relacionado{' '}
                        {esEducacionSuperior ? 'desde Observaciones o Solicitudes de matrícula.' : 'desde Observaciones.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link to="/app/observaciones" className="inst-btn inst-btn-secondary text-sm">
                            Observaciones
                        </Link>
                        {esEducacionSuperior ? (
                            <Link to="/app/solicitudes-matricula" className="inst-btn inst-btn-secondary text-sm">
                                Solicitudes de matrícula
                            </Link>
                        ) : null}
                        <Link to="/app/expedientes" className="inst-btn inst-btn-secondary text-sm">
                            Expedientes
                        </Link>
                        <button type="button" className="inst-btn inst-btn-secondary text-sm" disabled title="Solo preferencias personales; sin configuración global">
                            Preferencias de notificación
                        </button>
                    </div>
                </SectionCard>
            </section>
        );
    }

    const actions = [
        { to: '/app/control-escolar/notificaciones', label: 'Marcar leídas', variant: 'primary', icon: 'check' },
        { to: '/app/control-escolar/notificaciones', label: 'Archivar', variant: 'muted', icon: 'arrowDownTray' },
    ];
    const metrics = [
        { title: 'No leídas', value: '12', trend: 'Incluye recordatorios', tone: 'blue' },
        { title: 'Críticas', value: '3', trend: 'Requieren acción', tone: 'red' },
        { title: 'Recordatorios', value: '8', trend: 'Cierre de etapas', tone: 'orange' },
        { title: 'Automáticas', value: '46', trend: 'Sistema / bandejas', tone: 'purple' },
    ];

    const seleccion = CE_DEMO_NOTIFICACIONES[0];

    const rightPanel = (
        <CeInstSurface title="Detalle">
            <p className="text-sm font-bold text-slate-900">{seleccion.titulo}</p>
            <p className="mt-2 text-xs text-slate-500">
                {seleccion.cat} · {seleccion.fecha}
            </p>
            <p className="mt-4 text-sm text-slate-700">
                Abre el expediente o la bandeja enlazada para continuar el trámite. Las reglas globales del sistema no se configuran desde este rol.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/app/expedientes" className="inst-btn inst-btn-primary text-sm">
                    Ir al expediente
                </Link>
                <Link to="/app/control-escolar/solicitudes" className="inst-btn inst-btn-secondary text-sm">
                    Ver solicitud
                </Link>
            </div>
        </CeInstSurface>
    );

    return (
        <CeShell
            title="Centro de notificaciones"
            subtitle="Lectura y seguimiento operativo. Preferencias personales únicamente — sin administrar categorías globales ni alertas del sistema."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4">
                    <CeInstSurface title="Categorías">
                        <ul className="space-y-1 text-sm">
                            {CATEGORIAS.map((c) => (
                                <li key={c}>
                                    <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                                        {c}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button type="button" className="inst-btn inst-btn-secondary mt-4 w-full text-sm">
                            Preferencias de notificación
                        </button>
                    </CeInstSurface>
                </div>
                <div className="lg:col-span-8">
                    <CeInstSurface title="Lista de notificaciones">
                        <ul className="divide-y divide-slate-100">
                            {CE_DEMO_NOTIFICACIONES.map((n, i) => (
                                <li key={i} className="flex flex-wrap items-start justify-between gap-3 py-4">
                                    <div>
                                        <p className="font-semibold text-slate-900">{n.titulo}</p>
                                        <p className="text-xs text-slate-500">
                                            {n.cat} · {n.fecha}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {!n.leida ? <CeStatusBadge>Pendiente</CeStatusBadge> : <CeStatusBadge>Leída</CeStatusBadge>}
                                        {n.critica ? <CeStatusBadge>Crítica</CeStatusBadge> : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                </div>
            </div>
        </CeShell>
    );
}
