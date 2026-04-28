<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            NivelAcademicoSeeder::class,
            EstadoCatalogoSeeder::class,
            TipoDocumentoSeeder::class,
            TipoCertificacionSeeder::class,
            MotorDocumentoSeeder::class,
            ProveedorFirmaSeeder::class,
            RolesAndPermissionsSeeder::class,
            DemoUsuariosPorRolSeeder::class,
            CadenaOriginalReglaSeeder::class,
            XmlPlantillaSeeder::class,
            PlantillaDocumentoSeeder::class,
            FirmaConfiguracionSeeder::class,
        ]);
    }
}
