import { NavLink } from 'react-router-dom';

function item(to, label) {
    return { to, label };
}

const common = [item('/app/dashboard', 'Dashboard')];

const roleMenu = {
    control_escolar_escuela: [
        { group: 'Control Escolar', links: [ ...common, item('/app/documentos/nuevo', 'Nuevo documento'), item('/app/documentos/bandejas/por-rol', 'Mis documentos'), item('/app/alumnos', 'Alumnos'), item('/app/matriculas', 'Matriculas'), item('/app/materias-cursadas', 'Materias / Calificaciones'), item('/app/trayectorias', 'Trayectoria'), item('/app/importaciones', 'Importaciones')]},
        { group: 'Revision', links: [item('/app/documentos/bandejas/borradores', 'Borradores'), item('/app/documentos/bandejas/en-revision', 'En revision'), item('/app/documentos/bandejas/rechazados', 'Observados'), item('/app/documentos/bandejas/aprobados', 'Aprobados')]},
    ],
    director_escuela: [
        { group: 'Control Escolar', links: [...common, item('/app/documentos/bandejas/por-rol', 'Documentos de escuela')]},
        { group: 'Revision', links: [item('/app/documentos/bandejas/por-enviar', 'Por enviar'), item('/app/documentos/bandejas/en-revision', 'En revision'), item('/app/documentos/bandejas/aprobados', 'Aprobados'), item('/app/documentos/bandejas/rechazados', 'Rechazados')]},
    ],
    educacion_superior: [
        { group: 'Revision', links: [...common, item('/app/documentos/bandejas/pendientes-revision', 'Pendientes'), item('/app/documentos/bandejas/rechazados', 'Observados'), item('/app/documentos/bandejas/aprobados', 'Aprobados'), item('/app/documentos/validacion', 'Validacion academica')]},
        { group: 'Sistemas', links: [item('/app/documentos/bandejas/listos-para-firma', 'Listos para firma')]},
    ],
    sistemas: [
        { group: 'Sistemas', links: [item('/app/sistemas/dashboard', 'Dashboard tecnico'), item('/app/sistemas/listos-para-firma', 'Listos para firma'), item('/app/documentos/bandejas/firmados', 'Firmados'), item('/app/documentos/bandejas/errores-firma', 'Errores tecnicos'), item('/app/documentos/bandejas/pendientes-tecnicos', 'Pendientes tecnicos'), item('/app/sistemas/logs', 'Logs tecnicos'), item('/app/sistemas/configuracion', 'Configuracion tecnica')]},
    ],
    admin: [
        { group: 'Administracion', links: [...common, item('/app/admin/dashboard', 'Dashboard admin'), item('/app/documentos/bandejas/por-rol', 'Documentos'), item('/app/admin/usuarios-roles', 'Usuarios y roles'), item('/app/admin/catalogos', 'Catalogos'), item('/app/auditoria', 'Auditoria'), item('/app/admin/parametros', 'Parametros')]},
    ],
    superadmin: [
        { group: 'Administracion', links: [...common, item('/app/superadmin/dashboard', 'Dashboard superadmin'), item('/app/documentos/bandejas/por-rol', 'Documentos'), item('/app/admin/usuarios-roles', 'Usuarios y roles'), item('/app/admin/catalogos', 'Catalogos'), item('/app/auditoria', 'Auditoria'), item('/app/admin/parametros', 'Parametros'), item('/app/admin/reportes-basicos', 'Reportes basicos')]},
    ],
    auditor: [
        { group: 'Auditoria', links: [...common, item('/app/auditoria', 'Panel de auditoria'), item('/app/documentos/bandejas', 'Bandejas'), item('/app/sistemas/logs', 'Logs tecnicos')]},
    ],
    consulta: [
        { group: 'Consulta', links: [...common, item('/app/consulta/dashboard', 'Panel consulta'), item('/app/documentos/bandejas', 'Consultar documentos')]},
    ],
    docente: [
        { group: 'Docente', links: [...common, item('/app/docente/dashboard', 'Panel docente')]},
    ],
    coordinador_academico: [
        { group: 'Coordinacion', links: [...common, item('/app/coordinador/dashboard', 'Panel coordinacion')]},
    ],
};

export function Sidebar({ user, open = false, onClose }) {
    const role = user?.roles?.[0] ?? 'admin';
    const groups = roleMenu[role] ?? [{ group: 'General', links: common }];

    return (
        <aside className={`sices-sidebar fixed inset-y-0 left-0 z-40 w-72 p-4 transition-transform md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="mb-4 flex items-center justify-between md:block">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">SICES v2</p>
                    <p className="mt-1 text-[11px] text-slate-300">Plataforma institucional</p>
                </div>
                <button className="inst-btn inst-btn-secondary text-xs md:hidden" onClick={onClose}>Cerrar</button>
            </div>
            <nav className="grid gap-4">
                {groups.map((group) => (
                    <div key={group.group} className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-2">
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-400">{group.group}</p>
                        <div className="grid gap-1">
                            {group.links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-200 hover:bg-slate-800'}`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
