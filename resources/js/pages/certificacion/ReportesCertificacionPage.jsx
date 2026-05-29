import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CertFilterField,
    CertificacionFilters,
    CertificacionPageHeader,
    CertificacionPlaceholder,
    certInputStyle,
    certTheme,
} from '../../components/certificacion';
import { useCertificacionResumen } from '../../hooks/useCertificacionBandeja';
import { userCanAny } from '../../utils/userPermissions';

export function ReportesCertificacionPage() {
    const { resumen, loading, error } = useCertificacionResumen();
    const [tipo, setTipo] = useState('solicitudes');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const canExport = userCanAny(['reportes.ver', 'reportes.exportar']);

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Reportes de certificación"
                subtitle="Resumen operativo del periodo. Exportación formal conectada a reportes institucionales."
            />

            <CertificacionPlaceholder
                type="info"
                title="Flujo de certificación"
                detail="Educación Superior procesa el flujo normal automatizado (certificacion.procesar y certificacion.firmar). Sistemas atiende incidencias técnicas, diagnóstico y reintentos cuando el procesamiento falla."
            />

            <CertificacionFilters>
                <CertFilterField label="Tipo de reporte" width={200}>
                    <select style={certInputStyle()} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="solicitudes">Solicitudes por periodo</option>
                        <option value="generados">Documentos generados</option>
                        <option value="entrega">Tiempos de entrega</option>
                        <option value="programa">Certificados por programa</option>
                    </select>
                </CertFilterField>
                <CertFilterField label="Desde" width={160}>
                    <input type="date" style={certInputStyle()} value={desde} onChange={(e) => setDesde(e.target.value)} />
                </CertFilterField>
                <CertFilterField label="Hasta" width={160}>
                    <input type="date" style={certInputStyle()} value={hasta} onChange={(e) => setHasta(e.target.value)} />
                </CertFilterField>
            </CertificacionFilters>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={certTheme.btnPrimary}>
                    Generar reporte
                </button>
                {canExport ? (
                    <button type="button" style={certTheme.btnSecondary} disabled title="Exportación masiva pendiente de endpoint">
                        Exportar
                    </button>
                ) : null}
                <Link to="/app/admin/reportes-basicos" style={certTheme.btnSecondary}>
                    Reportes globales
                </Link>
            </div>

            {loading ? <p style={{ fontSize: 13, color: '#64748b' }}>Cargando resumen…</p> : null}
            {error ? <CertificacionPlaceholder type="warn" detail={error} /> : null}

            <div style={certTheme.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Resumen del periodo (bandejas actuales)</h3>
                <div className="cert-grid-2" style={{ fontSize: 14 }}>
                    <p>Pendientes revisión: <strong>{resumen?.pendientes_revision ?? 0}</strong></p>
                    <p>Aprobados: <strong>{resumen?.aprobados ?? 0}</strong></p>
                    <p>En procesamiento: <strong>{resumen?.listos_para_firma ?? 0}</strong></p>
                    <p>Firmados: <strong>{resumen?.firmados ?? 0}</strong></p>
                    <p>Rechazados: <strong>{resumen?.rechazados ?? 0}</strong></p>
                    <p>Cancelados: <strong>{resumen?.cancelados ?? 0}</strong></p>
                </div>
            </div>

            <CertificacionPlaceholder
                title="Filtros avanzados"
                detail="Filtros por programa, institución y sede se conectarán al motor de reportes dedicado. Los valores mostrados provienen de GET /certificacion/bandejas/documentos-academicos/resumen."
            />
        </div>
    );
}
