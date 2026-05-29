import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CertificacionPageHeader,
    CertificacionTable,
    CertTableLink,
    certTheme,
} from '../../components/certificacion';
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';
import { CERT_PERM } from '../../utils/certificacionPermissions';
import { userCanAny } from '../../utils/userPermissions';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { uxEsSistemasTecnico, uxLinkIncidenciaTecnica } from '../../utils/uxInstitucional';

const TABS = [
    { key: 'listos-para-firma', label: 'Pendientes de firma' },
    { key: 'firmados', label: 'Firmados' },
    { key: 'errores-firma', label: 'Incidencias de firma' },
];

export function FirmaElectronicaPage() {
    const [tab, setTab] = useState('listos-para-firma');
    const { rows, error, loading } = useCertificacionBandeja(tab, {});

    const canIncidencia = userCanAny(CERT_PERM.enviarIncidenciaSistemas);

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Firma y resultado final"
                subtitle="Seguimiento del estado de firma y entrega del documento."
            />

            <InstitutionalRoleBanner />

            <div className="cert-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`cert-tab-btn ${tab === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <CertificacionTable
                rows={rows}
                loading={loading}
                error={error}
                columns={[
                    { key: 'folio', label: 'Folio', render: (r) => r.folio_interno ?? `#${r.id}` },
                    { key: 'alumno', label: 'Alumno', render: (r) => r.alumno?.nombre_completo ?? '—' },
                    { key: 'firmante', label: 'Firmante', render: () => 'SEP / SINCE' },
                    {
                        key: 'fecha',
                        label: 'Fecha firma',
                        render: (r) =>
                            r.fecha_firma ? new Date(r.fecha_firma).toLocaleString('es-MX') : '—',
                    },
                    { key: 'estado', label: 'Estado', render: (r) => r.estado_firma ?? r.estado_workflow ?? '—' },
                    { key: 'folio_sep', label: 'Folio digital', render: (r) => r.folio_digital_sep ?? '—' },
                ]}
                renderActions={(row) => (
                    <>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Ver estado</CertTableLink>
                        {canIncidencia && row.estado_firma === 'error_firma' ? (
                            <CertTableLink to={uxLinkIncidenciaTecnica(row.id)}>
                                Incidencia técnica
                            </CertTableLink>
                        ) : null}
                    </>
                )}
            />

            {canIncidencia && uxEsSistemasTecnico() ? (
                <p style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
                    Bandeja de incidencias:{' '}
                    <Link to="/app/sistemas/proceso-tecnico-certificacion" style={certTheme.link}>
                        Incidencias técnicas de certificación
                    </Link>
                </p>
            ) : null}
        </div>
    );
}
