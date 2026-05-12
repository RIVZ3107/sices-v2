<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Convención única para el dataset semirreal de tableros por rol (no productivo).
 */
final class DatasetVisualRolesMetadata
{
    public const ORIGEN = 'dataset_visual_roles';

    public const DATASET = 'sices_visual_roles_v1';

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    public static function mark(array $extra = []): array
    {
        return array_merge([
            'origen' => self::ORIGEN,
            'dataset' => self::DATASET,
            'no_productivo' => true,
        ], $extra);
    }
}
