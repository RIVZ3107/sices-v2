import { decNormalApi, firmaSinceApi } from '../api/decNormal';
import { documentosAcademicosApi } from '../api/documentosAcademicos';
import { ES_CERT_FUNCIONAL } from '../utils/esCertificacionPermissions';
import { userCanAny } from '../utils/userPermissions';

/** Permisos técnicos — solo Sistemas / reintento en incidencias */
const PERM_TECNICO_SISTEMAS = [
    'cadena_original.generar',
    'generar_cadena',
    'xml.generar',
    'generar_xml',
    'firma.preflight',
    'firma.ejecutar',
    'solicitar_firma',
    'preparar_documento_firma',
    'documentos.liberar_proceso_tecnico',
];

/**
 * Ejecuta el pipeline técnico automático cuando el usuario tiene permiso funcional de procesar.
 * Si un paso falla, devuelve error para registrar incidencia (Sistemas atiende).
 */
export async function ejecutarProcesoCertificacion(documentoId, { onPaso, listoParaFirma = false } = {}) {
    const pasos = [];
    const puedeProcesar = userCanAny(ES_CERT_FUNCIONAL.procesar);
    const puedeTecnicoSistemas = userCanAny(PERM_TECNICO_SISTEMAS);

    if (!puedeProcesar && !puedeTecnicoSistemas) {
        return {
            ok: false,
            pasos,
            error: 'No tiene permiso para procesar certificaciones.',
        };
    }

    try {
        if (!listoParaFirma) {
            await documentosAcademicosApi.marcarListoParaFirma(documentoId, {
                motivo: 'Procesamiento automático de certificación (Educación Superior).',
            });
            pasos.push('Marcado para procesamiento automático');
            onPaso?.('Preparación');
        }

        const steps = [
            { nombre: 'Payload', fn: () => decNormalApi.generarPayload(documentoId) },
            { nombre: 'Cadena original', fn: () => decNormalApi.generarCadena(documentoId) },
            { nombre: 'XML DEC', fn: () => decNormalApi.generarXml(documentoId) },
            { nombre: 'Validación XML', fn: () => decNormalApi.validarXml(documentoId) },
            { nombre: 'Preflight', fn: () => decNormalApi.preflight(documentoId) },
        ];

        for (const step of steps) {
            onPaso?.(step.nombre);
            await step.fn();
            pasos.push(step.nombre);
        }

        const puedeFirmar =
            userCanAny(ES_CERT_FUNCIONAL.firmar) || userCanAny(['firma.ejecutar', 'solicitar_firma']);

        if (puedeFirmar) {
            onPaso?.('Firma / timbrado');
            const firma = await firmaSinceApi.ejecutar(documentoId);
            if (firma?.success === false) {
                throw new Error(firma?.message ?? 'La firma no se completó.');
            }
            pasos.push('Firma / timbrado');
        } else {
            return {
                ok: true,
                parcial: true,
                pasos,
                message:
                    'Procesamiento completado hasta preflight. La firma requiere permiso certificacion.firmar o seguimiento posterior.',
            };
        }

        return { ok: true, pasos, message: 'Certificación procesada correctamente.' };
    } catch (e) {
        return {
            ok: false,
            pasos,
            error:
                e?.message
                ?? e?.original?.response?.data?.message
                ?? 'Error en el procesamiento automático. Registre incidencia para Sistemas.',
        };
    }
}

/** @param {object} doc */
export function puedeProcesarCertificacion(doc, permisos) {
    const can = (list) => userCanAny(list);
    if (!can(permisos?.procesar ?? ES_CERT_FUNCIONAL.procesar)) return false;
    return (
        doc?.estado_workflow === 'aprobado'
        && doc?.folio_interno
        && !doc?.listo_para_firma
        && doc?.estado_firma !== 'firmado'
        && !doc?.tiene_observaciones_pendientes
    );
}

export function puedeFirmarCertificacion(doc, permisos) {
    if (!userCanAny(permisos?.firmar ?? ES_CERT_FUNCIONAL.firmar)) return false;
    return Boolean(doc?.listo_para_firma) && doc?.estado_firma !== 'firmado' && doc?.estado_firma !== 'error_firma';
}

export function tieneIncidenciaTecnica(doc) {
    return doc?.estado_firma === 'error_firma' || doc?.metadata?.firma_servicio_34?.last_error;
}
