import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeIcons,
    CeMetricCard,
    CeStatusBadge,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';
import { userCanAny } from '../../utils/userPermissions';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { UX_COPY } from '../../utils/uxInstitucional';

const PERMISOS_ADMIN_TECNICO = [
    'menus.administrar',
    'roles.administrar',
    'permisos.administrar',
    'plantillas.ver',
    'plantillas.administrar',
];

export function DocumentosCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const esAdminTecnico = userCanAny(PERMISOS_ADMIN_TECNICO);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.documentos({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar los documentos.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const totalListado = meta.total ?? 0;

    const accesosAdmin = (payload?.accesos_rapidos ?? []).filter((a) => {
        const ruta = a.ruta ?? '';
        if (ruta.includes('plantillas') || ruta.includes('/admin/roles')) {
            return esAdminTecnico;
        }
        return false;
    });

    return (
        <div style={{ ...ceTheme.pageShell }}>
            <InstitutionalRoleBanner message={UX_COPY.controlEscolar} />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Documentos escolares</h1>
                <Link
                    to="/app/certificacion/solicitud"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        height: 40,
                        padding: '0 18px',
                        borderRadius: 8,
                        background: '#185FA5',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}
                >
                    Iniciar solicitud documental
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <Link to="/app/certificacion/solicitud" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5' }}>
                    Nueva solicitud
                </Link>
                <Link to="/app/documentos/bandejas/borradores" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5' }}>
                    Solicitudes en captura
                </Link>
                <Link to="/app/documentos/bandejas/en-revision" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5' }}>
                    Pendientes de revisión
                </Link>
                <Link to="/app/expedientes" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5' }}>
                    Expedientes
                </Link>
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', background: '#FEF3C7', color: '#92400e', borderRadius: 8, fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard
                    icon={CeIcons.file}
                    iconBg="#EEEDFE"
                    iconColor="#534AB7"
                    title="Solicitudes en captura"
                    value={loading && !payload ? '…' : formatCeNum(metricas.solicitudes_en_captura ?? 0)}
                    trend="En su alcance territorial"
                    trendColor="#64748b"
                />
                <CeMetricCard
                    icon={CeIcons.checkCircle}
                    iconBg="#FEF3C7"
                    iconColor="#BA7517"
                    title="Enviadas a validación"
                    value={loading && !payload ? '…' : formatCeNum(metricas.enviadas_validacion ?? 0)}
                    trend="Con el certificador"
                    trendColor="#BA7517"
                />
                <CeMetricCard
                    icon={CeIcons.upload}
                    iconBg="#DBEAFE"
                    iconColor="#185FA5"
                    title="Observadas"
                    value={loading && !payload ? '…' : formatCeNum(metricas.observadas ?? 0)}
                    trend="Requieren corrección"
                    trendColor="#185FA5"
                />
                <CeMetricCard
                    icon={CeIcons.file}
                    iconBg="#DCFCE7"
                    iconColor="#0F6E56"
                    title="Rechazadas / canceladas"
                    value={loading && !payload ? '…' : formatCeNum(metricas.rechazadas_canceladas ?? 0)}
                    trend="Cierre institucional"
                    trendColor="#0F6E56"
                />
            </div>

            <div style={ceTheme.surface}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                        gap: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Solicitudes y documentos</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                            Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                        </p>
                    </div>
                    <input
                        type="search"
                        placeholder="Buscar alumno o documento…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            height: 36,
                            width: 240,
                            padding: '0 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            fontSize: 13,
                        }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Tipo', 'Alumno', 'Etapa', 'Siguiente acción', 'Último mov.', 'Acción'].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: '12px 10px',
                                            textAlign: 'left',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: '#64748b',
                                            borderBottom: '1px solid #e2e8f0',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                        Cargando…
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                        No hay solicitudes documentales en tu alcance.
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((r, i) => (
                                <tr key={r.id ?? i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600 }}>{r.tipo || r.nombre}</td>
                                    <td style={{ padding: '12px 10px', fontSize: 12 }}>
                                        <div>{r.alumno}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{r.matricula}</div>
                                    </td>
                                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569' }}>{r.fecha}</td>
                                    <td style={{ padding: '12px 10px', fontSize: 12 }}>
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569' }}>
                                        {r.siguiente_accion ?? '—'}
                                    </td>
                                    <td style={{ padding: '12px 10px', fontSize: 11, color: '#64748b' }}>
                                        {r.fecha} {r.hora}
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <Link
                                            to={r.detalle_url ?? '#'}
                                            style={{ fontSize: 12, fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}
                                        >
                                            Ver solicitud
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid #f1f5f9',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                        {meta.from && meta.to
                            ? `${meta.from}–${meta.to} de ${formatCeNum(meta.total)}`
                            : `Total: ${formatCeNum(meta.total ?? 0)}`}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            style={{
                                minWidth: 32,
                                height: 32,
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            ‹
                        </button>
                        <span
                            style={{
                                minWidth: 32,
                                height: 32,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 6,
                                background: '#185FA5',
                                color: '#fff',
                                fontSize: 13,
                            }}
                        >
                            {meta.current_page ?? page}
                        </span>
                        <button
                            type="button"
                            disabled={loading || (meta.last_page ?? 1) <= page}
                            onClick={() => setPage((p) => p + 1)}
                            style={{
                                minWidth: 32,
                                height: 32,
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                cursor: (meta.last_page ?? 1) <= page ? 'not-allowed' : 'pointer',
                            }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            </div>

            {esAdminTecnico && accesosAdmin.length > 0 ? (
                <div style={{ ...ceTheme.surface, marginTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Administración técnica</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {accesosAdmin.map((a, i) => (
                            <Link key={i} to={a.ruta ?? '#'} style={{ fontSize: 12, fontWeight: 500, color: '#185FA5' }}>
                                {a.nombre}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
