import { useState } from 'react';
import {
    CertFilterField,
    CertificacionFilters,
    CertificacionPageHeader,
    CertificacionTable,
    certInputStyle,
    certTheme,
} from '../../components/certificacion';
import { InstitutionalBandejaActions, ejecutarAccionBandeja } from '../../components/bandeja/InstitutionalBandejaActions';
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { EMPTY_BANDEJA } from '../../utils/bandejaWorkflow';
import { uxEsCertificadorOperativo } from '../../utils/uxInstitucional';

const TABS_CERTIFICADOR = [
    { key: 'en-validacion-certificador', label: 'Pendientes de validar' },
    { key: 'observado-por-certificador', label: 'Observados / devueltos' },
    { key: 'validado-por-certificador', label: 'Validados' },
];

export function DocumentosACertificarPage() {
    const esCert = uxEsCertificadorOperativo();
    const [tab, setTab] = useState(esCert ? 'en-validacion-certificador' : 'validado-por-certificador');
    const [filters, setFilters] = useState({ q: '', tipo_documento: '' });
    const [busyId, setBusyId] = useState(null);
    const [msg, setMsg] = useState('');

    const { rows, error, loading, recargar } = useCertificacionBandeja(tab, filters);

    const tabs = esCert ? TABS_CERTIFICADOR : [{ key: 'validado-por-certificador', label: 'Validados por certificador' }];

    async function onAccion(accion, row) {
        setBusyId(row.id);
        setMsg('');
        try {
            await ejecutarAccionBandeja(accion.accion, row.id, `${accion.label} desde bandeja.`);
            setMsg('Operación registrada correctamente.');
            await recargar();
        } catch (e) {
            setMsg(e?.message ?? 'No se pudo completar la acción.');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title={esCert ? 'Validación académica' : 'Documentos a certificar'}
                subtitle={
                    esCert
                        ? 'Revise expedientes pendientes de validación. No procesa ni firma documentos.'
                        : 'Seguimiento institucional de documentos en trámite.'
                }
            />

            <InstitutionalRoleBanner />

            {msg ? <p style={{ fontSize: 13, color: '#0F6E56', margin: 0 }}>{msg}</p> : null}

            <div className="cert-tabs">
                {tabs.map((t) => (
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
                emptyMessage={esCert ? EMPTY_BANDEJA.certificador : EMPTY_BANDEJA.educacion_superior}
                renderActions={(row) => (
                    <InstitutionalBandejaActions row={row} busy={busyId === row.id} onAccion={onAccion} />
                )}
            />
        </div>
    );
}
