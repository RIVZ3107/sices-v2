<?php

declare(strict_types=1);

namespace App\Enums\DocumentosAcademicos;

enum AccionWorkflowDocumento: string
{
    case ENVIAR_VALIDACION = 'enviar_validacion';
    case CORREGIR_OBSERVACIONES = 'corregir_observaciones';
    case VALIDAR_INFORMACION = 'validar_informacion';
    case DEVOLVER_OBSERVACIONES = 'devolver_observaciones';
    case APROBAR_EXPEDIENTE = 'aprobar_expediente';
    case ASIGNAR_FOLIO = 'asignar_folio';
    case PROCESAR_CERTIFICACION = 'procesar_certificacion';
    case FIRMAR_CERTIFICADO = 'firmar_certificado';
    case VER_RESULTADO_FINAL = 'ver_resultado_final';
    case ENVIAR_INCIDENCIA_TECNICA = 'enviar_incidencia_tecnica';
    case TOMAR_INCIDENCIA = 'tomar_incidencia';
    case REINTENTAR_PROCESO = 'reintentar_proceso';
    case RECHAZAR = 'rechazar';
    case CANCELAR = 'cancelar';

    public function label(): string
    {
        return match ($this) {
            self::ENVIAR_VALIDACION => 'Enviar a validación',
            self::CORREGIR_OBSERVACIONES => 'Corregir y reenviar',
            self::VALIDAR_INFORMACION => 'Validar información',
            self::DEVOLVER_OBSERVACIONES => 'Devolver con observaciones',
            self::APROBAR_EXPEDIENTE => 'Aprobar expediente',
            self::ASIGNAR_FOLIO => 'Asignar folio',
            self::PROCESAR_CERTIFICACION => 'Procesar certificación',
            self::FIRMAR_CERTIFICADO => 'Firmar certificado',
            self::VER_RESULTADO_FINAL => 'Ver resultado final',
            self::ENVIAR_INCIDENCIA_TECNICA => 'Enviar a incidencia técnica',
            self::TOMAR_INCIDENCIA => 'Tomar incidencia',
            self::REINTENTAR_PROCESO => 'Reintentar proceso',
            self::RECHAZAR => 'Rechazar',
            self::CANCELAR => 'Cancelar',
        };
    }
}
