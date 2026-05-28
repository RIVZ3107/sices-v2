import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CertFilterField,
    CertificacionFilters,
    CertificacionPageHeader,
    CertificacionTable,
    CertTableLink,
    certInputStyle,
    certTheme,
} from '../../components/certificacion';
import { bandejasApi } from '../../api/bandejas';
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';

const BANDEJAS_SOLICITUD = [
    { key: 'en-revision', label: 'En revisión' },
    { key: 'pendientes-revision', label: 'Pendientes' },
    { key: 'por-rol', label: 'Por rol' },
];

export function SolicitudesCertificacionPage() {
    const [bandeja, setBandeja] = useState('en-revision');
    const [filters, setFilters] = useState({
        q: '',
        tipo_documento: '',
        estado_workflow: '',
    });

    const hookBandeja = bandeja === 'por-rol' ? 'en-revision' : bandeja;
    const { rows: hookRows, error: hookError, loading: hookLoading } = useCertificacionBandeja(
        bandeja === 'por-rol' ? 'pendientes-revision' : hookBandeja,
        filters,
    );
    const [porRolRows, setPorRolRows] = useState(null);
    const [porRolError, setPorRolError] = useState('');
    const [porRolLoading, setPorRolLoading] = useState(false);

    useEffect(() => {
        if (bandeja !== 'por-rol') {
            setPorRolRows(null);
            return;
        }
        setPorRolLoading(true);
        bandejasApi
            .porRol(filters)
            .then((res) => {
                setPorRolRows(Array.isArray(res?.data) ? res.data : []);
                setPorRolError('');
            })
            .catch((err) => {
                setPorRolRows([]);
                setPorRolError(err?.message ?? 'No se pudo cargar la bandeja por rol.');
            })
            .finally(() => setPorRolLoading(false));
    }, [bandeja, JSON.stringify(filters)]);

    const rows = bandeja === 'por-rol' ? porRolRows : hookRows;
    const error = bandeja === 'por-rol' ? porRolError : hookError;
    const loading = bandeja === 'por-rol' ? porRolLoading : hookLoading;

    const filtered = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Solicitudes de certificación"
                subtitle="Bandeja institucional de documentos enviados a revisión. La dictaminación se realiza en revisión institucional."
            />

            <div className="cert-tabs">
                {BANDEJAS_SOLICITUD.map((b) => (
                    <button
                        key={b.key}
                        type="button"
                        className={`cert-tab-btn ${bandeja === b.key ? 'active' : ''}`}
                        onClick={() => setBandeja(b.key)}
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            <CertificacionFilters
                onReset={() => setFilters({ q: '', tipo_documento: '', estado_workflow: '' })}
            >
                <CertFilterField label="Búsqueda alumno / folio" width={240}>
                    <input
                        style={certInputStyle()}
                        value={filters.q}
                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                        placeholder="Nombre, CURP o folio"
                    />
                </CertFilterField>
                <CertFilterField label="Tipo documento">
                    <select
                        style={certInputStyle()}
                        value={filters.tipo_documento}
                        onChange={(e) => setFilters((f) => ({ ...f, tipo_documento: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="certificado">Certificado</option>
                        <option value="constancia">Constancia</option>
                    </select>
                </CertFilterField>
                <CertFilterField label="Estatus workflow">
                    <select
                        style={certInputStyle()}
                        value={filters.estado_workflow}
                        onChange={(e) => setFilters((f) => ({ ...f, estado_workflow: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="en_revision">En revisión</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                    </select>
                </CertFilterField>
            </CertificacionFilters>

            <CertificacionTable
                rows={filtered}
                loading={loading}
                error={error}
                columns={[
                    { key: 'folio', label: 'Folio', render: (r) => r.folio_interno ?? `#${r.id}` },
                    { key: 'alumno', label: 'Alumno', render: (r) => r.alumno?.nombre_completo ?? r.alumno?.curp ?? '—' },
                    { key: 'tipo', label: 'Tipo documento', render: (r) => r.tipo_documento ?? '—' },
                    {
                        key: 'fecha',
                        label: 'Fecha solicitud',
                        render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '—'),
                    },
                    { key: 'estatus', label: 'Estatus', render: (r) => r.estado_workflow ?? '—' },
                ]}
                renderActions={(row) => (
                    <>
                        <CertTableLink to={`/app/certificacion/revision/${row.id}`}>Revisar</CertTableLink>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Ver</CertTableLink>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Historial</CertTableLink>
                    </>
                )}
            />

            <p style={{ fontSize: 12, color: '#64748b' }}>
                También puede usar la{' '}
                <Link to="/app/certificacion/revision" style={certTheme.link}>
                    bandeja de revisión institucional
                </Link>
                .
            </p>
        </div>
    );
}
