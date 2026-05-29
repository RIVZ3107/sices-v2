import { useState } from 'react';
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
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';
import { CERT_PERM } from '../../utils/certificacionPermissions';
import { userCanAny } from '../../utils/userPermissions';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { uxLinkIncidenciaTecnica } from '../../utils/uxInstitucional';

export function GeneracionDocumentosPage() {
    const [filters, setFilters] = useState({ q: '' });
    const { rows, error, loading } = useCertificacionBandeja('aprobados', filters);

    const canPdf = userCanAny(CERT_PERM.obtenerResultadoFinal);
    const canIncidencia = userCanAny(CERT_PERM.enviarIncidenciaSistemas);

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Generación de documentos"
                subtitle="Seguimiento del resultado documental institucional."
            />
            <InstitutionalRoleBanner />

            <CertificacionFilters onReset={() => setFilters({ q: '' })}>
                <CertFilterField label="Buscar documento" width={280}>
                    <input
                        style={certInputStyle()}
                        value={filters.q}
                        onChange={(e) => setFilters({ q: e.target.value })}
                        placeholder="Folio, alumno o ID"
                    />
                </CertFilterField>
            </CertificacionFilters>

            <CertificacionTable
                rows={rows}
                loading={loading}
                error={error}
                columns={[
                    { key: 'id', label: 'Solicitud', render: (r) => `#${r.id}` },
                    { key: 'alumno', label: 'Alumno', render: (r) => r.alumno?.nombre_completo ?? '—' },
                    { key: 'tipo', label: 'Tipo', render: (r) => `${r.tipo_documento} (${r.tipo_certificacion ?? '—'})` },
                    {
                        key: 'gen',
                        label: 'Estado generación',
                        render: (r) => {
                            const parts = [];
                            if (r.estado_cadena) parts.push(`Cadena: ${r.estado_cadena}`);
                            if (r.estado_xml) parts.push(`XML: ${r.estado_xml}`);
                            return parts.length ? parts.join(' · ') : (r.estado_workflow ?? '—');
                        },
                    },
                    {
                        key: 'obs',
                        label: 'Observaciones',
                        render: (r) => (r.observaciones_abiertas > 0 ? `${r.observaciones_abiertas} abiertas` : 'Sin pendientes'),
                    },
                ]}
                renderActions={(row) => (
                    <>
                        <CertTableLink to={`/app/alumnos/${row.alumno_id ?? row.alumno?.id}/expediente`}>Expediente</CertTableLink>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Ver documento</CertTableLink>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Historial</CertTableLink>
                        {canPdf ? (
                            <span style={{ fontSize: 12, color: '#64748b', marginRight: 8 }} title="PDF oficial pendiente de backend productivo">
                                Vista previa PDF
                            </span>
                        ) : null}
                        {canIncidencia && row.estado_firma === 'error_firma' ? (
                            <CertTableLink to={uxLinkIncidenciaTecnica(row.id)}>
                                Incidencia técnica
                            </CertTableLink>
                        ) : null}
                    </>
                )}
            />

        </div>
    );
}
