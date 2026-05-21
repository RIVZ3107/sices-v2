import { useState } from 'react';
import { CeInstSurface, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_CONFIG_CRITICAS, SIS_CONFIG_HISTORIAL } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

const TABS = ['General', 'Seguridad', 'Sesiones', 'Correos', 'Firma SEP/SINCE', 'Documentos', 'Consulta pública', 'Parámetros académicos', 'Almacenamiento', 'Jobs y colas'];

export function SistemasConfiguracionGlobalPage() {
    const [tab, setTab] = useState('General');
    const actions = [
        { to: '/app/sistemas/configuracion-global', label: 'Guardar cambios', variant: 'primary', icon: 'check' },
        { to: '/app/sistemas/configuracion-global', label: 'Restaurar valores', variant: 'muted', icon: 'refreshCw' },
        { to: '/app/sistemas/configuracion-global', label: 'Publicar configuración', variant: 'success', icon: 'send' },
        { to: '/app/sistemas/configuracion-global', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
        { to: '/app/sistemas/configuracion-global', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];
    const metrics = [
        { title: 'Parámetros activos', value: '248', trend: 'Última actualización 20/05/2025 08:32', tone: 'blue' },
        { title: 'Cambios pendientes', value: '12', trend: 'No publicados', tone: 'orange' },
        { title: 'Variables protegidas', value: '27', trend: 'Requieren permisos elevados', tone: 'purple' },
        { title: 'Ambientes sincronizados', value: '3 / 3', trend: 'Prod · Pruebas · Dev', tone: 'green' },
    ];

    return (
        <CeShell
            title="Configuración global del sistema"
            subtitle={`Pestaña activa: ${tab}. Los secretos se muestran enmascarados (••••••••).`}
            actions={actions}
            metrics={metrics}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Historial de cambios">
                        <ul className="space-y-3 text-xs text-slate-700">
                            {SIS_CONFIG_HISTORIAL.map((h) => (
                                <li key={h.texto} className="border-b border-slate-100 pb-2">
                                    <p className="font-medium">{h.texto}</p>
                                    <p className="mt-1 text-slate-500">
                                        {h.usuario} · {h.cuando}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Configuraciones críticas" className="mt-4">
                        <ul className="space-y-2 text-xs">
                            {SIS_CONFIG_CRITICAS.map((c) => (
                                <li key={c.nombre} className="flex items-center justify-between">
                                    <span>{c.nombre}</span>
                                    <CeStatusBadge>{c.badge}</CeStatusBadge>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            tab === t ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <CeInstSurface title="Parámetros generales">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Nombre de la institución</span>
                        <input className="inst-input" defaultValue="Instituto Tecnológico de Educación Superior" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Ciclo escolar activo</span>
                        <input className="inst-input" defaultValue="2024 — 2025" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Zona horaria</span>
                        <select className="inst-input">
                            <option>(UTC-06:00) Ciudad de México</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Tiempo de sesión (inactividad)</span>
                        <select className="inst-input">
                            <option>30 minutos</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Idioma predeterminado</span>
                        <select className="inst-input">
                            <option>Español (México)</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Tamaño máximo de archivo</span>
                        <div className="flex gap-2">
                            <input className="inst-input w-24" defaultValue="50" />
                            <select className="inst-input flex-1">
                                <option>MB</option>
                            </select>
                        </div>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Formato de fecha</span>
                        <select className="inst-input">
                            <option>DD/MM/YYYY</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Codificación</span>
                        <input className="inst-input" defaultValue="UTF-8" readOnly />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-semibold text-slate-700">Ambiente activo</span>
                        <select className="inst-input">
                            <option>Producción</option>
                            <option>Pruebas</option>
                            <option>Desarrollo</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm md:col-span-2">
                        <span className="font-semibold text-slate-700">Secreto SMTP (enmascarado)</span>
                        <input className="inst-input font-mono text-xs" defaultValue="••••••••••••••••" readOnly />
                    </label>
                </div>
                <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-900">
                    Estos parámetros aplican a todos los módulos. Los cambios entran en vigor al publicar la configuración.
                </p>
            </CeInstSurface>
        </CeShell>
    );
}
