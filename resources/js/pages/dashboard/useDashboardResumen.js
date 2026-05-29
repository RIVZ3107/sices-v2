import { useEffect, useState } from 'react';
import { bandejasApi } from '../../api/bandejas';
import { fetchDashboard } from '../../api/dashboard';
import { sanitizeInstitutionalMessage } from '../../utils/uxInstitucional';

/**
 * Resumen unificado vía GET /api/v1/dashboard con respaldo a bandejas.
 * `fullPayload` contiene el payload completo de Control Escolar cuando aplica.
 */
export function useDashboardResumen() {
    const [resumen, setResumen] = useState(null);
    const [fullPayload, setFullPayload] = useState(null);
    const [extras, setExtras] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setError('');

        fetchDashboard()
            .then((body) => {
                if (cancelled) {
                    return;
                }
                const wrap = body?.data ?? {};
                const p = wrap.payload ?? {};
                if (p.contexto !== undefined && p.metricas !== undefined) {
                    setFullPayload(p);
                    setResumen(p.metricas ?? {});
                    setExtras(null);
                    return;
                }
                setFullPayload(null);
                const base = p.metricas ?? p.bandeja_resumen ?? {};
                const merged = { ...base };
                if (p.panel_metricas && typeof p.panel_metricas === 'object') {
                    Object.assign(merged, p.panel_metricas);
                }
                if (Array.isArray(p.cards)) {
                    for (const c of p.cards) {
                        if (c?.key) {
                            merged[c.key] = c.value ?? 0;
                        }
                    }
                }
                setResumen(merged);
                setExtras({
                    cards: p.cards ?? [],
                    notas: p.notas ?? [],
                    tabla: p.tabla_solicitudes_matricula ?? null,
                    tablaNormativa: p.tabla_expedientes_normativa ?? null,
                    tablaLiberar: p.tabla_documentos_pendientes_liberar ?? null,
                    alertasNormativas: Array.isArray(p.alertas_normativas) ? p.alertas_normativas : [],
                    movimientos: p.movimientos_recientes ?? null,
                    soloLectura: p.solo_lectura ?? false,
                    soloDatosPropios: p.solo_datos_propios ?? false,
                    telemetriaVisual: p.telemetria_visual ?? null,
                    contextoAlumno: p.contexto_alumno ?? null,
                    historialAspirante: p.historial ?? null,
                });
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }
                bandejasApi
                    .resumen()
                    .then((res) => {
                        if (!cancelled) {
                            setResumen(res?.data ?? {});
                            setFullPayload(null);
                            setExtras(null);
                        }
                    })
                    .catch((err) => {
                        if (!cancelled) {
                            setResumen({});
                            setFullPayload(null);
                            setExtras(null);
                            setError(
                                sanitizeInstitutionalMessage(
                                    err?.message,
                                    'No se pudo cargar el resumen de indicadores.',
                                ),
                            );
                        }
                    });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { resumen, error, fullPayload, extras };
}
