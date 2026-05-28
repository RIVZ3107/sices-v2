<?php

declare(strict_types=1);

namespace App\Enums\Certificacion;

/**
 * Canal de firma/timbrado según subsistema y tipo documental.
 */
enum CanalFirmaDocumento: string
{
    /** Educación Normal: servicio 34 SEP (urlshort + shadow legacy). */
    case NORMAL_CERTIFICADO_SEP = 'normal_certificado_sep';

    /** UPN: firma local (sello/openssl simulado) + PDF controlado, sin servicio 34. */
    case UPN_FIRMA_LOCAL = 'upn_firma_local';

    /** Título profesional: timbrado vía since-títulos. */
    case TITULO_SEP = 'titulo_sep';

    /** Grado académico: timbrado vía since-títulos (endpoint dedicado). */
    case GRADO_SEP = 'grado_sep';

    public function label(): string
    {
        return match ($this) {
            self::NORMAL_CERTIFICADO_SEP => 'Certificado Normal — timbrado SEP (servicio 34)',
            self::UPN_FIRMA_LOCAL => 'UPN — firma local y PDF',
            self::TITULO_SEP => 'Título — timbrado SEP (since-títulos)',
            self::GRADO_SEP => 'Grado — timbrado SEP (since-títulos)',
        };
    }

    public function requiereServicio34(): bool
    {
        return $this === self::NORMAL_CERTIFICADO_SEP;
    }

    public function requiereSinceTitulos(): bool
    {
        return $this === self::TITULO_SEP || $this === self::GRADO_SEP;
    }
}
