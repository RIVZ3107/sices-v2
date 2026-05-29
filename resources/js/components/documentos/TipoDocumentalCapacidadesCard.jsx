import {
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
} from '../../utils/documentosAcademicosTipos';

function Fila({ label, activo, nota }) {
    return (
        <li style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ fontWeight: 600, color: activo ? '#0F6E56' : '#94a3b8' }}>
                {activo ? 'Sí' : 'No'}
                {nota ? <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4 }}>{nota}</span> : null}
            </span>
        </li>
    );
}

/**
 * Resumen de capacidades del tipo documental (solo informativo — Control Escolar no procesa ni firma).
 */
export function TipoDocumentalCapacidadesCard({ capacidades, pipelineKey, plantillaKey }) {
    const cap = capacidades ?? {};

    if (!Object.keys(cap).length && !pipelineKey) {
        return (
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Seleccione un tipo documental para ver las reglas de procesamiento que aplicará el sistema en etapas posteriores.
            </p>
        );
    }

    return (
        <div className="grid gap-2">
            {pipelineKey ? (
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Referencia de pipeline: <code>{pipelineKey}</code>
                    {plantillaKey ? (
                        <>
                            {' '}
                            · Plantilla: <code>{plantillaKey}</code>
                        </>
                    ) : null}
                </p>
            ) : null}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                <Fila label="Requiere XML SEP" activo={requiereXmlSep({ capacidades: cap })} />
                <Fila label="Requiere firma SEP" activo={requiereFirmaSep({ capacidades: cap })} />
                <Fila label="Requiere firma local" activo={requiereFirmaLocal({ capacidades: cap })} />
                <Fila label="Requiere firma (cualquier canal)" activo={requiereFirma({ capacidades: cap })} />
                <Fila label="Requiere folio de control" activo={requiereFolio({ capacidades: cap })} />
                <Fila label="Requiere URL short" activo={requiereUrlShort({ capacidades: cap })} />
                <Fila label="Genera PDF" activo={requierePdf({ capacidades: cap })} />
                <Fila label="Consulta pública" activo={requiereConsultaPublica({ capacidades: cap })} />
                <Fila label="Jasper fallback (temporal)" activo={permiteJasper({ capacidades: cap })} />
                <Fila label="Editor de plantilla (futuro)" activo={permiteEditorPlantilla({ capacidades: cap })} />
                <Fila
                    label="Puente Informix"
                    activo={permiteInformix({ capacidades: cap })}
                    nota="futuro/diagnóstico"
                />
            </ul>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                Educación Superior ejecutará el procesamiento automático. Sistemas atiende solo incidencias técnicas.
            </p>
        </div>
    );
}
