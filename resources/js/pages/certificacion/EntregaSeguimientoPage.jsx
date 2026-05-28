import { useState } from 'react';
import {
    CertificacionPageHeader,
    CertificacionPlaceholder,
    CertificacionTable,
    CertTableLink,
    certTheme,
} from '../../components/certificacion';
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';
import { userCanAny } from '../../utils/userPermissions';

export function EntregaSeguimientoPage() {
    const [tab, setTab] = useState('firmados');
    const { rows, error, loading } = useCertificacionBandeja(tab, {});

    const canPdf = userCanAny(['pdf.ver', 'pdf.generar']);
    const canConsulta = userCanAny(['consulta_publica.ver', 'consulta_publica.configurar']);

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Entrega y seguimiento"
                subtitle="Certificados firmados y trazabilidad de entrega al alumno o consulta pública."
            />

            <div className="cert-tabs">
                <button
                    type="button"
                    className={`cert-tab-btn ${tab === 'firmados' ? 'active' : ''}`}
                    onClick={() => setTab('firmados')}
                >
                    Certificados firmados
                </button>
            </div>

            <CertificacionTable
                rows={rows}
                loading={loading}
                error={error}
                columns={[
                    { key: 'folio', label: 'Folio', render: (r) => r.folio_interno ?? `#${r.id}` },
                    { key: 'alumno', label: 'Alumno', render: (r) => r.alumno?.nombre_completo ?? '—' },
                    {
                        key: 'entrega',
                        label: 'Método entrega',
                        render: (r) => r.metadata?.entrega?.metodo ?? 'Pendiente de registro',
                    },
                    {
                        key: 'fecha',
                        label: 'Fecha entrega',
                        render: (r) =>
                            r.metadata?.entrega?.fecha
                                ? new Date(r.metadata.entrega.fecha).toLocaleDateString('es-MX')
                                : '—',
                    },
                    {
                        key: 'estatus',
                        label: 'Estatus entrega',
                        render: (r) => r.metadata?.entrega?.estatus ?? 'pendiente_entrega',
                    },
                ]}
                renderActions={(row) => (
                    <>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Ver certificado</CertTableLink>
                        {canPdf ? (
                            <span
                                style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}
                                title="Descarga PDF cuando el backend exponga el archivo oficial"
                            >
                                Descargar PDF
                            </span>
                        ) : null}
                        {canConsulta && row.token_consulta_publica ? (
                            <span style={{ fontSize: 12, color: '#185FA5' }}>Token: {row.token_consulta_publica}</span>
                        ) : null}
                    </>
                )}
            />

            <CertificacionPlaceholder
                title="Marcar entregado"
                detail="La acción de confirmar entrega física/digital se habilitará cuando exista permiso y endpoint dedicados. Por ahora use la ficha del documento."
            />
        </div>
    );
}
