import { useCallback, useEffect, useState } from 'react';
import { certificadoVistaApi } from '../../api/certificadoVista';
import { ActionButton } from '../ActionButton';
import { AlertBox } from '../ui/AlertBox';
import { SectionCard } from '../ui/SectionCard';

function fila(label, valor) {
    return (
        <tr>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600">{label}</th>
            <td className="border border-slate-300 px-3 py-2 text-sm text-slate-800">{valor ?? '—'}</td>
        </tr>
    );
}

/**
 * Vista previa HTML del certificado a partir del JSON de vista (XML MySQL/Informix + dominio).
 */
export function CertificadoPdfPreview({ documentoId, estadoFirma }) {
    const [vista, setVista] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const firmado = estadoFirma === 'firmado';

    const cargar = useCallback(async () => {
        if (!firmado) return;
        setBusy(true);
        setError('');
        try {
            const res = await certificadoVistaApi.obtenerJson(documentoId);
            setVista(res?.data ?? null);
        } catch (err) {
            setVista(null);
            setError(err?.message ?? 'No se pudo cargar la vista del certificado.');
        } finally {
            setBusy(false);
        }
    }, [documentoId, firmado]);

    useEffect(() => {
        if (firmado) {
            void cargar();
        }
    }, [cargar, firmado]);

    if (!firmado) {
        return (
            <SectionCard title="Vista previa PDF" subtitle="Disponible tras firma SEP.">
                <p className="text-sm text-slate-600">
                    El documento debe estar firmado para generar la vista del certificado oficial.
                </p>
            </SectionCard>
        );
    }

    const doc = vista?.documento ?? {};
    const alumno = vista?.alumno ?? {};
    const inst = vista?.institucion ?? {};
    const materias = Array.isArray(vista?.materias) ? vista.materias : [];

    return (
        <SectionCard
            title="Vista previa PDF"
            subtitle={`Fuente XML: ${vista?.xml?.fuente ?? '—'}`}
        >
            {error ? <AlertBox type="error" message={error} /> : null}
            <div className="mb-3 flex gap-2">
                <ActionButton variant="secondary" disabled={busy} onClick={() => void cargar()}>
                    {busy ? 'Cargando…' : 'Actualizar vista'}
                </ActionButton>
            </div>
            {vista ? (
                <div
                    className="mx-auto max-w-3xl border border-slate-300 bg-white p-8 shadow-sm print:shadow-none"
                    style={{ fontFamily: 'Georgia, serif' }}
                >
                    <header className="border-b-2 border-slate-800 pb-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Certificado electrónico</p>
                        <h2 className="mt-2 text-xl font-bold text-slate-900">{inst.nombre ?? 'Institución educativa'}</h2>
                        {inst.sede ? <p className="text-sm text-slate-600">{inst.sede}</p> : null}
                    </header>
                    <section className="mt-6 space-y-4 text-sm leading-relaxed text-slate-800">
                        <p>
                            Se certifica que <strong>{alumno.nombre_completo ?? '—'}</strong>
                            {alumno.curp ? <> (CURP: <span className="font-mono text-xs">{alumno.curp}</span>)</> : null}
                            {' '}cumplió con el plan de estudios correspondiente.
                        </p>
                        {inst.programa ? <p><strong>Programa:</strong> {inst.programa}</p> : null}
                        <table className="mt-4 w-full border-collapse">
                            <tbody>
                                {fila('Folio interno', doc.folio_interno)}
                                {fila('Folio digital SEP', doc.folio_digital_sep)}
                                {fila('Tipo', doc.tipo_documento)}
                                {fila('Fecha de firma', doc.fecha_firma ? new Date(doc.fecha_firma).toLocaleString('es-MX') : null)}
                            </tbody>
                        </table>
                        {materias.length > 0 ? (
                            <div className="mt-6">
                                <h3 className="mb-2 text-sm font-semibold uppercase text-slate-700">Materias</h3>
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border border-slate-300 px-2 py-1 text-left">Clave</th>
                                            <th className="border border-slate-300 px-2 py-1 text-left">Nombre</th>
                                            <th className="border border-slate-300 px-2 py-1 text-left">Calificación</th>
                                            <th className="border border-slate-300 px-2 py-1 text-left">Semestre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materias.map((m, i) => (
                                            <tr key={`${m.clave}-${i}`}>
                                                <td className="border border-slate-300 px-2 py-1">{m.clave}</td>
                                                <td className="border border-slate-300 px-2 py-1">{m.nombre}</td>
                                                <td className="border border-slate-300 px-2 py-1">{m.calificacion}</td>
                                                <td className="border border-slate-300 px-2 py-1">{m.semestre}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </section>
                    <footer className="mt-8 border-t border-slate-300 pt-4 text-center text-xs text-slate-500">
                        Documento generado desde SICES v2 — vista previa (no sustituye PDF oficial Jasper/SEP).
                    </footer>
                </div>
            ) : (
                <p className="text-sm text-slate-500">{busy ? 'Cargando vista…' : 'Sin datos de vista.'}</p>
            )}
        </SectionCard>
    );
}
