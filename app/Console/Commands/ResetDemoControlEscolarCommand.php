<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use Database\Seeders\Concerns\GuardsDemoSeeders;
use Database\Seeders\Demo\CertificacionControlEscolarDemoSeeder;
use Illuminate\Console\Command;

final class ResetDemoControlEscolarCommand extends Command
{
    protected $signature = 'sices:reset-demo-control-escolar
                            {--seed : Tras borrar datos demo marcados con metadata.origen=demo_control_escolar, ejecuta CertificacionControlEscolarDemoSeeder}
                            {--force : Requerido en entorno production para ejecutar el reset}';

    protected $description = 'Elimina sólo registros marcados demo de Control Escolar (metadata.origen) sin tocar catálogos institucionales ni municipios.';

    public function handle(ResetDemoControlEscolarService $reset): int
    {
        if ($this->laravel->environment('production') && ! $this->option('force')) {
            $this->error('En production esta operación requiere el flag explícito --force.');

            return self::FAILURE;
        }

        $reset->ejecutar();
        $this->info('Datos demo Control Escolar eliminados conforme marcado en metadata.origen=demo_control_escolar.');

        if ($this->option('seed')) {
            if (! GuardsDemoSeeders::demoSeedersAllowed()) {
                $this->error('Los seeders demo están deshabilitados. Active ALLOW_DEMO_SEEDERS=true solo en local/testing.');

                return self::FAILURE;
            }
            $this->call('db:seed', ['--class' => CertificacionControlEscolarDemoSeeder::class]);
        }

        return self::SUCCESS;
    }
}
