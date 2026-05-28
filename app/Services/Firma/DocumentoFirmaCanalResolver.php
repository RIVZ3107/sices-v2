<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Models\DocumentoAcademico;
use Illuminate\Validation\ValidationException;

class DocumentoFirmaCanalResolver
{
    public function resolver(DocumentoAcademico $documento): CanalFirmaDocumento
    {
        $documento->loadMissing('subsistema');
        $subsistema = strtoupper(trim((string) ($documento->subsistema?->clave ?? '')));
        $tipo = strtolower(trim((string) ($documento->tipo_documento ?? 'certificado')));

        if ($subsistema === 'UPN') {
            return CanalFirmaDocumento::UPN_FIRMA_LOCAL;
        }

        return match ($tipo) {
            'titulo' => CanalFirmaDocumento::TITULO_SEP,
            'grado' => CanalFirmaDocumento::GRADO_SEP,
            'certificado' => CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP,
            default => throw ValidationException::withMessages([
                'tipo_documento' => ["Tipo documental [{$tipo}] sin canal de firma configurado."],
            ]),
        };
    }
}
