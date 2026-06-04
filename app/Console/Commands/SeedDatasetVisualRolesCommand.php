<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\DatasetVisualRoles\SeedDatasetVisualRolesService;
use Illuminate\Console\Command;

/**
 * Dataset visual para tableros (no productivo). No forma parte del flujo de datos reales.
 *
 * @deprecated Preferir datos reales e importadores controlados. Ver docs/sices-v2/datos-reales/importacion-controlada.md
 */
final class SeedDatasetVisualRolesCommand extends Command
{
    protected $signature = 'sices:seed-dataset-visual-roles
                            {--force : Permitir ejecución en production}
                            {--replace : Ejecutar reset del dataset visual antes de sembrar}';

    protected $description = 'Genera dataset semirreal (Normal/UPN) para tableros por rol; no productivo.';

    public function handle(SeedDatasetVisualRolesService $seed): int
    {
        try {
            $seed->seed($this->option('force'), (bool) $this->option('replace'));
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Dataset visual roles sembrado correctamente.');
        $this->comment('Contraseña: variable de entorno SICES_DATASET_VISUAL_PASSWORD (por defecto SicesDataset2026!).');

        return self::SUCCESS;
    }
}
