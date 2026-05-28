import { UpnCertificateStatusBadge } from './UpnCertificateStatusBadge';
import { resolverEstatusUpn } from '../../utils/upnCertificacion';
import { formatFechaMx } from '../../utils/upnCertificacion';

export function UpnCertificadoSummaryCard({ doc, alumno, sede, programa }) {
    const estatus = resolverEstatusUpn({
        estado_workflow: doc?.estado_workflow,
        estado_firma: doc?.estado_firma,
        listo_para_firma: doc?.listo_para_firma,
    });

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                        {alumno?.nombre_completo ?? 'Certificado UPN'}
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        CURP {alumno?.curp ?? '—'} · Folio {doc?.folio_interno ?? 'Sin asignar'}
                    </p>
                </div>
                <UpnCertificateStatusBadge estatus={estatus} />
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 12,
                    marginTop: 16,
                    fontSize: 13,
                }}
            >
                <div>
                    <span style={{ color: '#64748b' }}>CCT / Subsede</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{sede?.clave ?? sede?.nombre ?? '—'}</p>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Carrera</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{programa?.nombre ?? '—'}</p>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Tipo</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{doc?.tipo_documento ?? '—'}</p>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Expedición</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>
                        {formatFechaMx(doc?.fecha_aprobacion ?? doc?.fecha_solicitud)}
                    </p>
                </div>
            </div>
        </div>
    );
}
