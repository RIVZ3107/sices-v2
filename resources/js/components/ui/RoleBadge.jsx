export function RoleBadge({ role }) {
    const map = {
        superadmin: { label: 'Superadmin', cls: 'inst-badge-info' },
        admin: { label: 'Admin', cls: 'inst-badge-info' },
        control_escolar_escuela: { label: 'Control Escolar', cls: 'inst-badge-success' },
        director_escuela: { label: 'Director Escuela', cls: 'inst-badge-warning' },
        educacion_superior: { label: 'Educación Superior', cls: 'inst-badge-success' },
        sistemas: { label: 'Sistemas', cls: 'inst-badge-info' },
        auditor: { label: 'Auditor', cls: 'inst-badge-warning' },
        consulta: { label: 'Consulta', cls: 'inst-badge-info' },
        docente: { label: 'Docente', cls: 'inst-badge-success' },
        coordinador_academico: { label: 'Coordinador', cls: 'inst-badge-warning' },
    };

    const item = map[role] ?? { label: role ?? 'Sin rol', cls: 'inst-badge-info' };

    return <span className={`inst-badge ${item.cls}`}>{item.label}</span>;
}
