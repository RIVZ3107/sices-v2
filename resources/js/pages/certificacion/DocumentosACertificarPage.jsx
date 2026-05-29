import { useState } from 'react';
import { Link } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
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
import { uxEsCertificadorOperativo, uxPuedeProcesarCertificacion, uxLinkIncidenciaTecnica } from '../../utils/uxInstitucional';

const TABS = [
    { key: 'aprobados', label: 'Aprobados' },
    { key: 'listos-para-firma', label: 'En procesamiento' },
    { key: 'pendientes-tecnicos', label: 'Pendientes folio' },
];

export function DocumentosACertificarPage() {
    const [tab, setTab] = useState('aprobados');
    const [filters, setFilters] = useState({ q: '', tipo_documento: '' });
    const [busyId, setBusyId] = useState(null);
    const [msg, setMsg] = useState('');

    const { rows, error, loading, recargar } = useCertificacionBandeja(tab, filters);

    const canProcesar = userCanAny(CERT_PERM.procesarCertificacion);
    const canIncidencia = userCanAny(CERT_PERM.enviarIncidenciaSistemas);

    async function procesar(docId) {
        if (!canProcesar) return;
        setBusyId(docId);
        setMsg('');
        try {
            await documentosAcademicosApi.marcarListoParaFirma(docId, {
                motivo: 'Inicio de procesamiento automático desde Certificación.',
            });
            setMsg('Certificación en procesamiento automático. Use la bandeja de Educación Superior para el flujo completo.');
            await recargar();
        } catch (e) {
            setMsg(e?.message ?? 'No se pudo iniciar el procesamiento.');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Documentos a certificar"
                subtitle="Seguimiento institucional de documentos en trámite."
            />

            <InstitutionalRoleBanner />

            {msg ? <p style={{ fontSize: 13, color: '#0F6E56', margin: 0 }}>{msg}</p> : null}
            {uxEsCertificadorOperativo() ? (
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                    Como certificador, valide la información en cada expediente. El procesamiento y la firma corresponden a Educación Superior.
                </p>
            ) : null}

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

            <CertificacionFilters onReset={() => setFilters({ q: '', tipo_documento: '' })}>
                <CertFilterField label="Búsqueda" width={260}>
                    <input
                        style={certInputStyle()}
                        value={filters.q}
                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                        placeholder="Alumno, folio o CURP"
                    />
                </CertFilterField>
                <CertFilterField label="Tipo">
                    <select
                        style={certInputStyle()}
                        value={filters.tipo_documento}
                        onChange={(e) => setFilters((f) => ({ ...f, tipo_documento: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="certificado">Certificado</option>
                    </select>
                </CertFilterField>
            </CertificacionFilters>

            <CertificacionTable
                rows={rows}
                loading={loading}
                error={error}
                columns={[
                    { key: 'folio', label: 'Folio', render: (r) => r.folio_interno ?? `#${r.id}` },
                    { key: 'alumno', label: 'Alumno', render: (r) => r.alumno?.nombre_completo ?? '—' },
                    { key: 'tipo', label: 'Tipo', render: (r) => r.tipo_documento ?? '—' },
                    { key: 'programa', label: 'Programa', render: (r) => r.programa?.nombre ?? r.oferta?.programa?.nombre ?? '—' },
                    { key: 'estatus', label: 'Estatus', render: (r) => r.estado_workflow ?? r.estado_firma ?? '—' },
                ]}
                renderActions={(row) => (
                    <>
                        <CertTableLink to={`/app/alumnos/${row.alumno_id ?? row.alumno?.id}/expediente`}>
                            Expediente
                        </CertTableLink>
                        <CertTableLink to={`/app/documentos/${row.id}`}>Ver</CertTableLink>
                        {canProcesar && tab === 'aprobados' && !row.listo_para_firma ? (
                            <button
                                type="button"
                                style={{ ...certTheme.btnPrimary, fontSize: 12, padding: '6px 10px' }}
                                disabled={busyId === row.id}
                                onClick={() => void procesar(row.id)}
                            >
                                Procesar certificación
                            </button>
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
