import { CeInstSurface, CeShell } from '../../components/controlEscolar/CeShell';
import { SIS_MONITOREO_SERIES } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasMonitoreoPage() {
    const actions = [
        { to: '/app/sistema/monitoreo', label: 'Actualizar', variant: 'primary', icon: 'refreshCw' },
        { to: '/app/sistema/monitoreo', label: 'Exportar métricas', variant: 'muted', icon: 'arrowUpTray' },
    ];
    const metrics = [
        { title: 'CPU', value: '34%', trend: 'Normal', tone: 'blue' },
        { title: 'RAM', value: '61%', trend: 'Normal', tone: 'green' },
        { title: 'Disco /', value: '72%', trend: 'Atención', tone: 'orange' },
        { title: 'Errores / h', value: '3.2', trend: 'Elevado', tone: 'red' },
    ];

    return (
        <CeShell
            title="Monitoreo de plataforma"
            subtitle="Consulta técnica de infraestructura y rendimiento. Sin operación académica."
            actions={actions}
            metrics={metrics}
            footerNote={FOOT}
            rightPanel={
                <CeInstSurface title="Últimos despliegues">
                    <ul className="text-xs text-slate-600 space-y-2">
                        <li>2025-05-18 · build 2.0.142 · OK</li>
                        <li>2025-05-10 · build 2.0.138 · OK</li>
                    </ul>
                </CeInstSurface>
            }
        >
            <CeInstSurface title="Indicadores en tiempo (referencia)">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SIS_MONITOREO_SERIES.map((m) => (
                        <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold text-slate-500">{m.label}</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">{m.valor}</p>
                            <p className="mt-1 text-xs text-slate-600">{m.estado}</p>
                        </div>
                    ))}
                </div>
            </CeInstSurface>
        </CeShell>
    );
}
