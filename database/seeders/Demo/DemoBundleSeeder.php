<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use Database\Seeders\Concerns\GuardsDemoSeeders;
use Illuminate\Database\Seeder;

/**
 * Paquete demo: usuarios @sices.local + expedientes sintéticos Control Escolar.
 */
final class DemoBundleSeeder extends Seeder
{
    use GuardsDemoSeeders;

    public function run(): void
    {
        $this->ensureDemoSeedersAllowed();

        $this->call([
            DemoUsuariosPorRolSeeder::class,
            CertificacionControlEscolarDemoSeeder::class,
        ]);
    }
}
