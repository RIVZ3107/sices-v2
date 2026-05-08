<?php

declare(strict_types=1);

namespace App\Support\ControlEscolar;

/**
 * Convenciones de marcado para datos sintéticos de Control Escolar.
 */
final class DemoControlEscolarMetadata
{
    public const ORIGEN = 'demo_control_escolar';

    public const DEMO_DATASET = 'control_escolar_v1';

    /** @param  array<string, mixed>  $extra */
    public static function marca(array $extra = []): array
    {
        return array_merge([
            'origen' => self::ORIGEN,
            'demo_dataset' => self::DEMO_DATASET,
        ], $extra);
    }
}
