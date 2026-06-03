<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Base\InstitutionalBaseSeeder;
use Database\Seeders\Concerns\GuardsDemoSeeders;
use Database\Seeders\Demo\DemoBundleSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed catálogos institucionales base. Datos demo solo con ALLOW_DEMO_SEEDERS=true.
     */
    public function run(): void
    {
        $this->call(InstitutionalBaseSeeder::class);

        if (GuardsDemoSeeders::demoSeedersAllowed() && ! app()->environment('production')) {
            $this->call(DemoBundleSeeder::class);
        }
    }
}
