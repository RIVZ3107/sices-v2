import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CertificacionPageHeader,
    CertificacionPlaceholder,
    CertificacionTable,
    CertTableLink,
    certTheme,
} from '../../components/certificacion';
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';
import { CERT_PERM } from '../../utils/certificacionPermissions';
import { userCanAny } from '../../utils/userPermissions';

const TABS = [
    { key: 'listos-para-firma', label: 'Pendientes de firma' },
    { key: 'firmados', label: 'Firmados' },
    { key: 'errores-firma', label: 'Incidencias de firma' },
];

export function FirmaElectronicaPage() {
    const [tab, setTab] = useState('listos-para-firma');
    const { rows, error, loading } = useCertificacionBandeja(tab, {});

    const canFirmar = userCanAny(CERT_PERM.firmarCertificacion);
    const canIncidencia = userCanAny(CERT_PERM.enviarIncidenciaSistemas);

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Firma electrónica"
                subtitle="Seguimiento del estado de firma y timbrado. La ejecución se realiza desde Educación Superior con certificacion.firmar; esta pantalla es consulta y monitoreo."
            />

            <CertificacionPlaceholder
                type="info"
                title="Seguimiento institucional"
                detail={
                    canFirmar
                        ? 'Con certificacion.firmar puede completar la firma desde la bandeja de Educación Superior o UPN (procesamiento automático). Aquí consulta el avance sin botones técnicos de cadena/XML.'
                        : 'Su perfil consulta el avance de firma. Para ejecutar firma o procesamiento requiere certificacion.firmar o certificacion.procesar en Educación Superior.'
                }
            />

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
                            <CertTableLink to={`/app/sistemas/documento-proceso-tecnico/${row.id}`}>
                                Diagnóstico incidencia
                            </CertTableLink>
                        ) : null}
                    </>
                )}
            />

            {canIncidencia ? (
                <p style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
                    Si el procesamiento falló, consulte{' '}
                    <Link to="/app/sistemas/proceso-tecnico-certificacion" style={certTheme.link}>
                        Incidencias técnicas de certificación
                    </Link>
                    . Sistemas atiende diagnóstico y reintentos; no es la bandeja operativa diaria.
                </p>
            ) : null}

            <CertificacionPlaceholder detail="Educación Superior procesa el flujo normal automatizado. Sistemas atiende incidencias técnicas cuando el procesamiento falla." />
        </div>
    );
}
