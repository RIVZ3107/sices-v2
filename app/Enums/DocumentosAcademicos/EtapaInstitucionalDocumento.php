<?php

declare(strict_types=1);

namespace App\Enums\DocumentosAcademicos;

enum EtapaInstitucionalDocumento: string
{
    case SOLICITADO_CONTROL_ESCOLAR = 'solicitado_control_escolar';
    case EN_VALIDACION_CERTIFICADOR = 'en_validacion_certificador';
    case OBSERVADO_POR_CERTIFICADOR = 'observado_por_certificador';
    case VALIDADO_POR_CERTIFICADOR = 'validado_por_certificador';
    case APROBADO_EDUCACION_SUPERIOR = 'aprobado_educacion_superior';
    case FOLIO_ASIGNADO = 'folio_asignado';
    case EN_PROCESAMIENTO = 'en_procesamiento';
    case PENDIENTE_FIRMA = 'pendiente_firma';
    case FIRMADO_TIMBRADO = 'firmado_timbrado';
    case FINALIZADO = 'finalizado';
    case INCIDENCIA_TECNICA = 'incidencia_tecnica';
    case EN_REVISION_SISTEMAS = 'en_revision_sistemas';
    case REINTENTADO = 'reintentado';
    case RECHAZADO = 'rechazado';
    case CANCELADO = 'cancelado';

    public function label(): string
    {
        return match ($this) {
            self::SOLICITADO_CONTROL_ESCOLAR => 'Solicitud en Control Escolar',
            self::EN_VALIDACION_CERTIFICADOR => 'En validación del certificador',
            self::OBSERVADO_POR_CERTIFICADOR => 'Observado por el certificador',
            self::VALIDADO_POR_CERTIFICADOR => 'Validado por el certificador',
            self::APROBADO_EDUCACION_SUPERIOR => 'Aprobado por Educación Superior',
            self::FOLIO_ASIGNADO => 'Folio asignado',
            self::EN_PROCESAMIENTO => 'En procesamiento',
            self::PENDIENTE_FIRMA => 'Pendiente de firma',
            self::FIRMADO_TIMBRADO => 'Firmado y timbrado',
            self::FINALIZADO => 'Finalizado',
            self::INCIDENCIA_TECNICA => 'Incidencia técnica',
            self::EN_REVISION_SISTEMAS => 'En revisión por Sistemas',
            self::REINTENTADO => 'Reintentado',
            self::RECHAZADO => 'Rechazado',
            self::CANCELADO => 'Cancelado',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function tryFromLoose(?string $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        return self::tryFrom($value);
    }
}
