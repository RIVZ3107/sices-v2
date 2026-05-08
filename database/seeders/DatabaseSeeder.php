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
            EntidadFederativaSeeder::class,
            MunicipioSeeder::class,
            SubsistemasSeeder::class,
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
            Catalogos\InstitucionesSedesInicialSeeder::class,
            Catalogos\InstitucionesLegacyBaseSeeder::class,
            Catalogos\InstitucionesSubsedesLegacySeeder::class,
        ]);
    }
}
