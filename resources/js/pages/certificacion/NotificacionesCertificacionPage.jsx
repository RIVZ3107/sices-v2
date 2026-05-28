import { useMemo, useState } from 'react';
import {
    CertFilterField,
    CertificacionFilters,
    CertificacionPageHeader,
    CertificacionPlaceholder,
    CertificacionTable,
    certInputStyle,
    certTheme,
} from '../../components/certificacion';
import { useDashboardResumen } from '../dashboard/useDashboardResumen';

/** Placeholder controlado — sin backend dedicado de notificaciones certificación. */
const DEMO_EMPTY = [];

export function NotificacionesCertificacionPage() {
    const { extras, loading } = useDashboardResumen();
    const [filters, setFilters] = useState({ q: '', tipo: '', estatus: '' });

    const items = useMemo(() => {
        const raw = extras?.notas ?? extras?.movimientos?.items ?? extras?.movimientos ?? [];
        if (!Array.isArray(raw)) return DEMO_EMPTY;
        return raw.map((n, i) => ({
            id: i,
            fecha: n.fecha ?? n.created_at ?? new Date().toISOString(),
            tipo: n.tipo ?? 'sistema',
            mensaje: n.descripcion ?? n.mensaje ?? n.label ?? String(n),
            estatus: n.estatus ?? 'leida',
        }));
    }, [extras]);

    const filtered = items.filter((row) => {
        if (filters.tipo && row.tipo !== filters.tipo) return false;
        if (filters.estatus && row.estatus !== filters.estatus) return false;
        if (filters.q && !row.mensaje.toLowerCase().includes(filters.q.toLowerCase())) return false;
        return true;
    });

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Notificaciones"
                subtitle="Avisos del flujo de certificación. Se muestran notas del tablero cuando existen."
            />

            <CertificacionFilters onReset={() => setFilters({ q: '', tipo: '', estatus: '' })}>
                <CertFilterField label="Búsqueda" width={240}>
                    <input
                        style={certInputStyle()}
                        value={filters.q}
                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                    />
                </CertFilterField>
                <CertFilterField label="Tipo">
                    <select
                        style={certInputStyle()}
                        value={filters.tipo}
                        onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="sistema">Sistema</option>
                        <option value="documento">Documento</option>
                    </select>
                </CertFilterField>
                <CertFilterField label="Estatus">
                    <select
                        style={certInputStyle()}
                        value={filters.estatus}
                        onChange={(e) => setFilters((f) => ({ ...f, estatus: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="nueva">Nueva</option>
                        <option value="leida">Leída</option>
                    </select>
                </CertFilterField>
            </CertificacionFilters>

            {loading ? <p style={{ fontSize: 13, color: '#64748b' }}>Cargando…</p> : null}

            {filtered.length === 0 ? (
                <CertificacionPlaceholder
                    title="Sin notificaciones en este momento"
                    detail="Cuando exista el endpoint /certificacion/notificaciones, esta vista lo consumirá. Mientras tanto se usan notas del dashboard si están disponibles."
                />
            ) : (
                <CertificacionTable
                    rows={filtered}
                    loading={false}
                    columns={[
                        {
                            key: 'fecha',
                            label: 'Fecha',
                            render: (r) => new Date(r.fecha).toLocaleString('es-MX'),
                        },
                        { key: 'tipo', label: 'Tipo', render: (r) => r.tipo },
                        { key: 'mensaje', label: 'Mensaje', render: (r) => r.mensaje },
                        { key: 'estatus', label: 'Estatus', render: (r) => r.estatus },
                    ]}
                />
            )}
        </div>
    );
}
