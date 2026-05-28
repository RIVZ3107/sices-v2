import { SectionCard } from '../ui/SectionCard';
import { DataTable } from '../ui/DataTable';
import { ValidationSummary } from '../academic/ValidationSummary';
import { EstadoSepLegacyPanel } from '../../pages/expedientes/components/EstadoSepLegacyPanel';
import { formatFechaMx } from '../../utils/upnCertificacion';

function Row({ label, value }) {
    return (
        <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            <strong>{label}:</strong> {value ?? '—'}
        </p>
    );
}

export function UpnCertificateDetailSections({ data, validacion, docMeta = {} }) {
    const doc = data?.documento;
    const alumno = data?.alumno;
    const trayectoria = data?.trayectoria ?? {};
    const meta = docMeta;

    const materiasRows = (data?.materias_cursadas ?? []).map((m) => ({
        clave: m.clave,
        nombre: m.nombre,
        calificacion: m.calificacion ?? m.calificacion_texto ?? '—',
        periodo: m.periodo_cursado ?? m.periodo ?? '—',
    }));

    const ultimaObs = (data?.observaciones ?? []).find((o) => o.estado === 'pendiente');

    return (
        <>
            <SectionCard title="A. Datos del alumno">
                <Row label="Primer apellido" value={alumno?.primer_apellido} />
                <Row label="Segundo apellido" value={alumno?.segundo_apellido} />
                <Row label="Nombre(s)" value={alumno?.nombre} />
                <Row label="CURP" value={alumno?.curp} />
                <Row label="Matrícula" value={data?.matricula?.matricula} />
            </SectionCard>

            <SectionCard title="B. Centro de trabajo / procedencia">
                <Row label="CCT" value={data?.sede?.clave ?? data?.sede?.cct} />
                <Row label="Institución" value={data?.institucion?.nombre} />
                <Row label="Subsede" value={data?.sede?.nombre} />
                <Row label="Localidad" value={meta?.localidad ?? data?.sede?.localidad ?? '—'} />
            </SectionCard>

            <SectionCard title="C. Datos del certificado">
                <Row label="Tipo de certificado" value={doc?.tipo_documento} />
                <Row label="Carrera / programa" value={data?.programa?.nombre} />
                <Row
                    label="Promedio"
                    value={trayectoria?.promedio ?? trayectoria?.promedio_aprovechamiento ?? meta?.promedio}
                />
                <Row label="Promedio en letra" value={meta?.promedio_letra ?? trayectoria?.promedio_letra} />
                <Row label="Fecha de expedición" value={formatFechaMx(doc?.fecha_aprobacion ?? doc?.fecha_solicitud)} />
            </SectionCard>

            <SectionCard title="D. Plan de estudios">
                <Row label="Modalidad" value={meta?.modalidad ?? data?.plan?.modalidad} />
                <Row label="Plan de estudios" value={data?.plan?.nombre} />
                <Row label="Total de asignaturas" value={trayectoria?.materias_plan ?? meta?.total_asignaturas} />
                <Row label="Asignaturas cursadas" value={trayectoria?.materias_acreditadas ?? materiasRows.length} />
                <Row label="Créditos" value={trayectoria?.creditos_obtenidos ?? trayectoria?.creditos_acumulados} />
                <DataTable
                    columns={[
                        { key: 'clave', label: 'Clave' },
                        { key: 'nombre', label: 'Materia' },
                        { key: 'calificacion', label: 'Calificación' },
                        { key: 'periodo', label: 'Periodo' },
                    ]}
                    rows={materiasRows}
                    emptyText="Sin materias registradas."
                />
            </SectionCard>

            <SectionCard title="E. Comentarios y aprobación">
                <Row label="Estado workflow" value={doc?.estado_workflow} />
                <Row label="Estado firma" value={doc?.estado_firma} />
                {ultimaObs ? (
                    <>
                        <Row label="Última observación" value={ultimaObs.observacion} />
                        <Row label="Prioridad" value={ultimaObs.prioridad} />
                    </>
                ) : (
                    <p style={{ fontSize: 13, color: '#64748b' }}>Sin observaciones pendientes.</p>
                )}
            </SectionCard>

            <SectionCard title="F. Folio y URL short">
                <Row label="Folio interno" value={doc?.folio_interno} />
                <Row label="Folio SEP / digital" value={meta?.folio_digital_sep ?? doc?.folio_digital_sep} />
                <Row label="URL short" value={meta?.url_short ?? doc?.token_consulta_publica} />
                <Row label="Token consulta pública" value={doc?.token_consulta_publica} />
            </SectionCard>

            <SectionCard title="G. PDF">
                <Row label="Estado PDF" value={meta?.estado_pdf ?? doc?.estado_pdf ?? '—'} />
                <p style={{ fontSize: 13, color: '#64748b' }}>
                    Consulte el documento académico para visualizar PDF sin firmar o firmado cuando estén disponibles en
                    almacenamiento.
                </p>
            </SectionCard>

            <ValidationSummary
                ok={Boolean(validacion?.valido)}
                errores={validacion?.errores ?? []}
                advertencias={validacion?.resumen?.advertencias ?? validacion?.advertencias ?? []}
            />

            <div id="sep">
                <SectionCard title="H. Estado SEP / SICES Legacy">
                    <EstadoSepLegacyPanel
                        alumnoId={alumno?.id}
                        documentoId={doc?.id}
                        curp={alumno?.curp}
                    />
                </SectionCard>
            </div>
        </>
    );
}
