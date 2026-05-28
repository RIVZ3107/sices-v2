import { Link } from 'react-router-dom';
import {
    CertIcons,
    CertificacionMetricCard,
    CertificacionPageHeader,
    CertificacionPlaceholder,
    certTheme,
} from '../../components/certificacion';
import { useCertificacionResumen } from '../../hooks/useCertificacionBandeja';
import { useDashboardResumen } from '../dashboard/useDashboardResumen';
import { LoadingState } from '../../components/LoadingState';

export function DashboardCertificacionPage() {
    const { resumen: bandejaResumen, loading: loadingB, error: errB } = useCertificacionResumen();
    const { resumen: dashResumen, extras, loading: loadingD } = useDashboardResumen();

    const r = { ...(dashResumen ?? {}), ...(bandejaResumen ?? {}) };
    const loading = loadingB || loadingD;

    if (loading && !Object.keys(r).length) {
        return <LoadingState text="Cargando indicadores de certificación…" />;
    }

    const recibidas = (r.en_revision ?? 0) + (r.pendientes_revision ?? 0);
    const enProceso = r.aprobados ?? 0;
    const generados = r.listos_para_firma ?? 0;
    const entregados = r.firmados ?? 0;

    const movimientos = extras?.movimientos?.items ?? extras?.movimientos ?? [];

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Dashboard de Certificación"
                subtitle="Indicadores operativos de solicitudes, emisión y entrega. La ejecución técnica de firma permanece en Sistemas."
            />

            {errB ? (
                <CertificacionPlaceholder
                    type="warn"
                    title="Resumen parcial"
                    detail={errB}
                />
            ) : null}

            <div className="cert-grid-4">
                <CertificacionMetricCard
                    title="Solicitudes recibidas"
                    value={recibidas}
                    icon={CertIcons.inbox}
                    to="/app/certificacion/solicitudes"
                    tone="primary"
                />
                <CertificacionMetricCard
                    title="En proceso"
                    value={enProceso}
                    icon={CertIcons.docs}
                    to="/app/certificacion/documentos-a-certificar"
                    tone="warn"
                />
                <CertificacionMetricCard
                    title="Certificados generados"
                    value={generados}
                    icon={CertIcons.file}
                    to="/app/certificacion/generacion-documentos"
                    tone="info"
                />
                <CertificacionMetricCard
                    title="Entregados / firmados"
                    value={entregados}
                    icon={CertIcons.truck}
                    to="/app/certificacion/entrega-seguimiento"
                    tone="success"
                />
            </div>

            <div className="cert-grid-2">
                <div style={certTheme.card}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Solicitudes por estatus</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>En revisión</span>
                            <strong>{r.en_revision ?? 0}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Pendientes de revisión</span>
                            <strong>{r.pendientes_revision ?? 0}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Aprobados</span>
                            <strong>{r.aprobados ?? 0}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span>Observados</span>
                            <strong>{r.rechazados ?? 0}</strong>
                        </li>
                    </ul>
                    <Link to="/app/certificacion/solicitudes" style={{ ...certTheme.link, display: 'inline-block', marginTop: 12 }}>
                        Ver solicitudes
                    </Link>
                </div>

                <div style={certTheme.card}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Documentos por etapa técnica</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Listos para proceso técnico</span>
                            <strong>{r.listos_para_firma ?? 0}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Firmados</span>
                            <strong>{r.firmados ?? 0}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span>Errores de firma</span>
                            <strong>{r.errores_firma ?? r.error_firma ?? 0}</strong>
                        </li>
                    </ul>
                    <Link to="/app/certificacion/firma-electronica" style={{ ...certTheme.link, display: 'inline-block', marginTop: 12 }}>
                        Seguimiento de firma
                    </Link>
                </div>
            </div>

            <div style={certTheme.card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Actividad reciente</h3>
                {Array.isArray(movimientos) && movimientos.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
                        {movimientos.slice(0, 8).map((m, i) => (
                            <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                {m.descripcion ?? m.mensaje ?? m.label ?? JSON.stringify(m)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <CertificacionPlaceholder
                        detail="Sin movimientos recientes en el tablero. Consulte las bandejas de solicitudes y documentos."
                    />
                )}
            </div>
        </div>
    );
}
