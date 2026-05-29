import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EsHeaderAction, EsPageLayout } from '../../components/educacionSuperior';
import {
    fetchTipoDocumentoAcademico,
    labelTipoDocumento,
    normalizarSubsistemaCatalogo,
    permiteEditorPlantilla,
    permiteInformix,
    permiteJasper,
    requiereConsultaPublica,
    requiereFirma,
    requiereFirmaLocal,
    requiereFirmaSep,
    requiereFolio,
    requierePdf,
    requiereUrlShort,
    requiereXmlSep,
    SUBSISTEMAS_DOCUMENTO,
} from '../../utils/documentosAcademicosTipos';
import {
    NORMALES_CERTIFICACION_PATH,
    UPN_CERTIFICACION_PATH,
} from '../../utils/certificacionRoutes';

function CapacidadRow({ label, value, nota }) {
    return (
        <li style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ fontWeight: 600, color: value ? '#0F6E56' : '#94a3b8' }}>{value ? 'Sí' : 'No'}</span>
            {nota ? <span style={{ fontSize: 11, color: '#94a3b8' }}>{nota}</span> : null}
        </li>
    );
}

/**
 * Placeholder institucional por subsistema y tipo documental.
 * @param {{ subsistema: 'normales'|'upn', tipoDocumento: string, titulo?: string, descripcion?: string }} props
 */
export function DocumentoAcademicoPlaceholderPage({
    subsistema,
    tipoDocumento,
    titulo,
    descripcion,
}) {
    const subKey = normalizarSubsistemaCatalogo(subsistema);
    const subMeta = SUBSISTEMAS_DOCUMENTO[subKey] ?? { label: subsistema };
    const certPath = subsistema === 'upn' ? UPN_CERTIFICACION_PATH : NORMALES_CERTIFICACION_PATH;

    const [def, setDef] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancel = false;
        setLoading(true);
        void fetchTipoDocumentoAcademico(tipoDocumento, subKey).then((data) => {
            if (!cancel) {
                setDef(data);
                setLoading(false);
            }
        });
        return () => {
            cancel = true;
        };
    }, [tipoDocumento, subKey]);

    const cap = def?.capacidades ?? def?.reglas ?? {};
    const tituloPagina = titulo ?? labelTipoDocumento(tipoDocumento);
    const subtitulo =
        descripcion
        ?? def?.descripcion
        ?? `Tipo documental en preparación para ${subMeta.label}.`;

    return (
        <EsPageLayout
            breadcrumbCurrent={tituloPagina}
            title={`${tituloPagina} — ${subMeta.label}`}
            subtitle={subtitulo}
            actions={<EsHeaderAction to={certPath} label="Ir a certificación" variant="secondary" />}
        >
            <div className="inst-surface p-6 grid gap-4 text-sm">
                <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600 }}>Tipo documental en preparación</h3>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>
                        Educación Superior operará este flujo cuando el módulo esté conectado. El catálogo ya define las
                        reglas de procesamiento; aún no hay generación real de PDF, firma ni XML en esta pantalla.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <p style={{ margin: 0 }}>
                        <strong>Subsistema:</strong> {subMeta.label} ({subKey})
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong>Tipo:</strong> {labelTipoDocumento(tipoDocumento)} ({tipoDocumento})
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong>Pipeline (referencia):</strong>{' '}
                        {loading ? '…' : cap.pipeline_key ?? '—'}
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong>Plantilla default:</strong>{' '}
                        {loading ? '…' : cap.plantilla_key_default ?? 'Por definir'}
                    </p>
                </div>

                {loading ? (
                    <p style={{ margin: 0, color: '#64748b' }}>Cargando reglas del catálogo…</p>
                ) : (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        <CapacidadRow label="Payload JSON (auditoría)" value={cap.requiere_payload_json !== false} />
                        <CapacidadRow label="XML SEP obligatorio" value={requiereXmlSep({ capacidades: cap })} />
                        <CapacidadRow label="Firma SEP" value={requiereFirmaSep({ capacidades: cap })} />
                        <CapacidadRow label="Firma local" value={requiereFirmaLocal({ capacidades: cap })} />
                        <CapacidadRow label="Requiere firma (cualquier canal)" value={requiereFirma({ capacidades: cap })} />
                        <CapacidadRow label="PDF" value={requierePdf({ capacidades: cap })} />
                        <CapacidadRow label="Folio de control" value={requiereFolio({ capacidades: cap })} />
                        <CapacidadRow label="URL short" value={requiereUrlShort({ capacidades: cap })} />
                        <CapacidadRow label="Consulta pública" value={requiereConsultaPublica({ capacidades: cap })} />
                        <CapacidadRow label="Editor de plantilla (futuro)" value={permiteEditorPlantilla({ capacidades: cap })} />
                        <CapacidadRow label="Jasper fallback temporal" value={permiteJasper({ capacidades: cap })} />
                        <CapacidadRow
                            label="Puente Informix (futuro/diagnóstico)"
                            value={permiteInformix({ capacidades: cap })}
                            nota="No es operación principal"
                        />
                    </ul>
                )}

                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Control Escolar captura datos · Certificador valida · Educación Superior aprueba y procesa · Sistemas
                    atiende incidencias técnicas.
                </p>

                <Link to={certPath} className="text-blue-700 hover:underline">
                    Volver a certificación {subsistema === 'upn' ? 'UPN' : 'Normales'}
                </Link>
            </div>
        </EsPageLayout>
    );
}
