import { useState } from 'react';
import { sicesLegacyApi } from '../../../api/sicesLegacy';
import { getUser } from '../../../authStore';
import { ActionButton } from '../../../components/ActionButton';
import { AlertBox } from '../../../components/ui/AlertBox';
import { SectionCard } from '../../../components/ui/SectionCard';

const PERMISOS_CONSULTA_SEP = [
    'sices_legacy.consultar',
    'sices_legacy.health',
    'sices_legacy.comparar',
    'documentos.ver',
    'ver_documentos',
    'expedientes.ver',
    'integraciones.ver',
];

function puedeConsultarSep() {
    const perms = getUser()?.permissions ?? [];
    return perms.some((p) => PERMISOS_CONSULTA_SEP.includes(p));
}

function mensajeErrorLegacy(err) {
    const payload = err?.original?.response?.data?.data;
    if (payload?.error && typeof payload.error === 'string') {
        return payload.error;
    }
    if (err?.status === 503 || err?.status === 401) {
        return 'No se pudo consultar SICES legacy. El expediente nuevo sigue disponible.';
    }
    return err?.message ?? 'No se pudo consultar SICES legacy. El expediente nuevo sigue disponible.';
}

function formatearUltimaConsulta(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function etiquetaTipo(tipo) {
    if (!tipo) return '—';
    const t = String(tipo).toUpperCase();
    if (t === 'P') return 'Parcial';
    if (t === 'T') return 'Total / término';
    return tipo;
}

export function EstadoSepLegacyPanel({ alumnoId, documentoId = null, curp = null }) {
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [ultimaConsulta, setUltimaConsulta] = useState(null);

    if (!puedeConsultarSep()) {
        return (
            <SectionCard title="Estado SEP / SICES">
                <p className="text-sm text-slate-600">No tiene permiso para consultar el estado en SICES legacy.</p>
            </SectionCard>
        );
    }

    async function consultar() {
        setBusy(true);
        setError('');
        setData(null);
        try {
            let res;
            if (documentoId) {
                res = await sicesLegacyApi.estadoSepDocumento(documentoId);
            } else if (alumnoId) {
                res = await sicesLegacyApi.estadoSepAlumno(alumnoId);
            } else if (curp) {
                res = await sicesLegacyApi.porCurp(curp);
            } else {
                setError('No hay alumno o documento para consultar.');
                return;
            }
            const payload = res?.data ?? null;
            setData(payload);
            if (payload?.success === true) {
                setUltimaConsulta(new Date().toISOString());
            } else if (payload?.success === false) {
                setError(payload.error ?? 'No se pudo consultar SICES legacy. El expediente nuevo sigue disponible.');
            }
        } catch (e) {
            const payload = e?.original?.response?.data?.data;
            if (payload && payload.success === false) {
                setData(payload);
                setError(payload.error ?? 'No se pudo consultar SICES legacy. El expediente nuevo sigue disponible.');
            } else {
                setError(mensajeErrorLegacy(e));
            }
        } finally {
            setBusy(false);
        }
    }

    const ok = data?.success === true;
    const estado = data?.estado ?? {};
    const materias = data?.materias ?? {};
    const enlaces = data?.enlaces ?? {};
    const cert = data?.certificado ?? null;

    return (
        <SectionCard
            title="Estado SEP / SICES legacy"
            subtitle="Consulta de solo lectura sobre Informix (emisión oficial SEP). No modifica SICES ni el servicio 34."
        >
            <div className="flex flex-wrap gap-2 mb-3">
                <ActionButton disabled={busy} onClick={() => void consultar()}>
                    {busy ? 'Consultando…' : 'Consultar estado'}
                </ActionButton>
                {enlaces.consulta_publica_sep && estado.url_short ? (
                    <a
                        href={enlaces.consulta_publica_sep}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inst-btn inst-btn-secondary text-sm"
                    >
                        Ver consulta pública SEP
                    </a>
                ) : null}
                {enlaces.sices_legacy ? (
                    <a
                        href={enlaces.sices_legacy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inst-btn inst-btn-secondary text-sm"
                    >
                        Ver en SICES legacy
                    </a>
                ) : null}
                {estado.pdf_generado && enlaces.pdf ? (
                    <a href={enlaces.pdf} target="_blank" rel="noopener noreferrer" className="inst-btn inst-btn-secondary text-sm">
                        Ver PDF
                    </a>
                ) : null}
            </div>

            {error ? <AlertBox type="warning" message={error} /> : null}

            {data && !ok ? (
                <AlertBox
                    type="warning"
                    message={
                        data.error
                        ?? 'No se pudo consultar SICES legacy. El expediente nuevo sigue disponible.'
                    }
                />
            ) : null}

            {ok ? (
                <div className="grid gap-3 text-sm md:grid-cols-2">
                    <p>
                        <strong>Encontrado en SICES:</strong>{' '}
                        {estado.existe_en_sices ? 'Sí' : 'No'}
                    </p>
                    <p>
                        <strong>Timbrado SEP:</strong>{' '}
                        {estado.timbrado ? 'Sí' : 'No'}
                    </p>
                    <p>
                        <strong>PDF generado:</strong>{' '}
                        {estado.pdf_generado ? 'Sí' : 'No'}
                    </p>
                    <p>
                        <strong>Tipo certificado:</strong> {etiquetaTipo(estado.tipo_certificado ?? cert?.tipo_certificado)}
                    </p>
                    <p>
                        <strong>Ciclo escolar:</strong> {estado.ciclo_escolar ?? cert?.ciclo_escolar ?? '—'}
                    </p>
                    <p>
                        <strong>URL short:</strong> {estado.url_short ?? cert?.url_short ?? '—'}
                    </p>
                    <p>
                        <strong>Folio digital SEP:</strong> {estado.folio_digital_sep ?? cert?.folio_digital_sep ?? '—'}
                    </p>
                    <p>
                        <strong>Última actualización (SICES):</strong>{' '}
                        {estado.ultima_actualizacion ?? cert?.fecha_modificacion ?? '—'}
                    </p>
                    <p>
                        <strong>Última consulta (esta pantalla):</strong>{' '}
                        {formatearUltimaConsulta(ultimaConsulta)}
                    </p>
                    <p className="md:col-span-2">
                        <strong>Materias:</strong> MySQL {materias.mysql ?? 0} · SICES {materias.sices ?? 0}
                        {materias.coinciden ? ' · Coinciden' : ' · Con diferencias'}
                    </p>
                    {(materias.diferencias ?? []).length > 0 ? (
                        <ul className="md:col-span-2 list-disc pl-5 text-amber-800">
                            {materias.diferencias.map((d, i) => (
                                <li key={i}>{d}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}

            {data === null && !error && !busy ? (
                <p className="text-sm text-slate-500">
                    Pulse «Consultar estado» para ver el timbrado y folio en SICES legacy (solo lectura).
                </p>
            ) : null}

            <p className="text-xs text-slate-400 mt-3 border-t pt-2">
                No se muestra XML, cadena original ni sello. La firma SEP (servicio 34) no se ejecuta desde esta pantalla.
            </p>
        </SectionCard>
    );
}
