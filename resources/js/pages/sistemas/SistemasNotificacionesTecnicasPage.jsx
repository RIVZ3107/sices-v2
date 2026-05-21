import { CeInstSurface, CeShell } from '../../components/controlEscolar/CeShell';
import { SIS_NOTIFICACIONES_TECNICAS } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasNotificacionesTecnicasPage() {
    const actions = [
        { to: '/app/sistemas/notificaciones-tecnicas', label: 'Marcar leídas', variant: 'primary', icon: 'check' },
        { to: '/app/sistemas/notificaciones-tecnicas', label: 'Filtrar', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'No leídas', value: '14', trend: 'Últimas 72 h', tone: 'orange' },
        { title: 'Críticas', value: '2', trend: 'Requieren acción', tone: 'red' },
        { title: 'Informativas', value: '36', trend: 'Archivadas auto 30d', tone: 'blue' },
        { title: 'Canales activos', value: '5', trend: 'Correo, panel, webhook', tone: 'purple' },
    ];

    return (
        <CeShell
            title="Notificaciones técnicas"
            subtitle="Avisos de mantenimiento, certificados, colas y despliegues."
            actions={actions}
            metrics={metrics}
            footerNote={FOOT}
        >
            <CeInstSurface title="Bandeja">
                <ul className="space-y-3 text-sm text-slate-800">
                    {SIS_NOTIFICACIONES_TECNICAS.map((n) => (
                        <li key={n.titulo} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="font-semibold">{n.titulo}</p>
                            <p className="mt-1 text-xs text-slate-600">{n.detalle}</p>
                            <p className="mt-2 text-[11px] text-slate-500">{n.fecha}</p>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
        </CeShell>
    );
}
