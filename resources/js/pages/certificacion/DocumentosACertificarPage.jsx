import { useEffect, useState } from 'react';
import {
    CertFilterField,
    CertificacionFilters,
    CertificacionPageHeader,
    CertificacionTable,
    certInputStyle,
    certTheme,
} from '../../components/certificacion';
import { CertificadorBandejaActions } from '../../components/certificacion/CertificadorBandejaActions';
import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { InstitutionalEmptyState } from '../../components/ui/InstitutionalEmptyState';
import { EMPTY_BANDEJA } from '../../utils/bandejaWorkflow';
import { columnasBandejaCertificador } from '../../utils/certificadorBandeja';
import { CERTIFICADOR_TABS } from '../../utils/certificadorUx';
import { EMPTY_BY_ROLE, UX_COPY, uxEsCertificadorOperativo } from '../../utils/uxInstitucional';
import { InstitutionalBandejaActions, ejecutarAccionBandeja } from '../../components/bandeja/InstitutionalBandejaActions';
import { fetchTiposDocumentosAcademicos } from '../../utils/documentosAcademicosTipos';

export function DocumentosACertificarPage() {
    const esCert = uxEsCertificadorOperativo();
    const [tab, setTab] = useState(esCert ? 'en-validacion-certificador' : 'validado-por-certificador');
    const [filters, setFilters] = useState({ q: '', tipo_documento: '' });
    const [busyId, setBusyId] = useState(null);
    const [msg, setMsg] = useState('');
    const [tiposOpts, setTiposOpts] = useState([]);

    const { rows, error, loading, recargar } = useCertificacionBandeja(tab, filters);

    const tabs = esCert
        ? CERTIFICADOR_TABS
        : [{ key: 'validado-por-certificador', label: 'Validados por certificador', activa: false }];

    useEffect(() => {
        if (!esCert) return;
        void fetchTiposDocumentosAcademicos('NORMAL').then((items) => setTiposOpts(items));
    }, [esCert]);

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

    const lista = Array.isArray(rows) ? rows : [];
    const emptyCert = EMPTY_BY_ROLE.certificador;
    const showEmptyInstitutional = esCert && !loading && !error && lista.length === 0;

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title={esCert ? 'Validación académica' : 'Documentos a certificar'}
                subtitle={
                    esCert
                        ? 'Revise solicitudes documentales enviadas por Control Escolar. No procesa, firma ni asigna folio.'
                        : 'Seguimiento institucional de documentos en trámite.'
                }
            />

            <InstitutionalRoleBanner message={esCert ? UX_COPY.certificador : undefined} />

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
                        placeholder="Alumno, CURP o matrícula"
                    />
                </CertFilterField>
                <CertFilterField label="Tipo documental">
                    <select
                        style={certInputStyle()}
                        value={filters.tipo_documento}
                        onChange={(e) => setFilters((f) => ({ ...f, tipo_documento: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        {tiposOpts.map((t) => (
                            <option key={t.key} value={t.key}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </CertFilterField>
            </CertificacionFilters>

            {showEmptyInstitutional ? (
                <InstitutionalEmptyState title={emptyCert.title} description={emptyCert.description} />
            ) : (
                <CertificacionTable
                    rows={lista}
                    loading={loading}
                    error={error}
                    columns={esCert ? columnasBandejaCertificador() : undefined}
                    emptyMessage={esCert ? emptyCert.title : EMPTY_BANDEJA.educacion_superior}
                    emptyDescription={
                        esCert
                            ? 'Cuando Control Escolar envíe solicitudes documentales, aparecerán aquí.'
                            : undefined
                    }
                    renderActions={(row) =>
                        esCert ? (
                            <CertificadorBandejaActions row={row} />
                        ) : (
                            <InstitutionalBandejaActions row={row} busy={busyId === row.id} onAccion={onAccion} />
                        )
                    }
                />
            )}
        </div>
    );
}
