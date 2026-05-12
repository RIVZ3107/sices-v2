<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\DatasetVisualRoles\ResetDatasetVisualRolesService;
use Illuminate\Console\Command;

final class ResetDatasetVisualRolesCommand extends Command
{
    protected $signature = 'sices:reset-dataset-visual-roles
                            {--seed : Tras el reset, ejecuta sices:seed-dataset-visual-roles}
                            {--force : Requerido en production}';

    protected $description = 'Elimina únicamente filas con metadata.dataset=sices_visual_roles_v1 (no catálogos reales).';

    public function handle(ResetDatasetVisualRolesService $reset): int
    {
        if ($this->laravel->environment('production') && ! $this->option('force')) {
            $this->error('En production esta operación requiere el flag explícito --force.');

            return self::FAILURE;
        }

        $reset->ejecutar();
        $this->info('Dataset visual roles eliminado (marcador metadata.dataset).');

        if ($this->option('seed')) {
            return $this->call('sices:seed-dataset-visual-roles', [
                '--force' => $this->option('force'),
            ]);
        }

        return self::SUCCESS;
    }
}
