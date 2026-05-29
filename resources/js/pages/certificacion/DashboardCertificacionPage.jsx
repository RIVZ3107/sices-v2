import { Link } from 'react-router-dom';
import {
    CertIcons,
    CertificacionMetricCard,
    CertificacionPageHeader,
    CertificacionPlaceholder,
    CertificacionQuickLinks,
    certTheme,
} from '../../components/certificacion';
import { useCertificacionResumen } from '../../hooks/useCertificacionBandeja';
import { useDashboardResumen } from '../dashboard/useDashboardResumen';
import { LoadingState } from '../../components/LoadingState';
import { ESTADOS_FLUJO } from '../../utils/certificacionEstadosInstitucionales';

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
                subtitle="Monitoreo de solicitudes, documentos, procesamiento automático y entrega. Educación Superior completa el flujo normal; Sistemas atiende incidencias técnicas."
            />

            <div style={certTheme.card}>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Flujo institucional</h3>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                    <li>Control Escolar captura o integra datos académicos.</li>
                    <li>El certificador valida que la información sea correcta (sin firma ni operaciones técnicas).</li>
                    <li>Educación Superior aprueba, asigna folio y procesa la certificación (cadena, XML, preflight, firma automática).</li>
                    <li>Si hay error técnico, se genera incidencia para Sistemas (diagnóstico y reintento).</li>
                </ol>
            </div>

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
                            <span>En procesamiento / listos</span>
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
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Estados del flujo</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.values(ESTADOS_FLUJO).map((e) => (
                        <span
                            key={e.key}
                            style={{
                                fontSize: 12,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#475569',
                            }}
                        >
                            {e.label}
                        </span>
                    ))}
                </div>
            </div>

            <CertificacionQuickLinks />

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
