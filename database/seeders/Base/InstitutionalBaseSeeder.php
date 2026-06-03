<?php

declare(strict_types=1);

namespace Database\Seeders\Base;

use Database\Seeders\CadenaOriginalReglaSeeder;
use Database\Seeders\Catalogos\InstitucionesLegacyBaseSeeder;
use Database\Seeders\Catalogos\InstitucionesSedesInicialSeeder;
use Database\Seeders\Catalogos\InstitucionesSubsedesLegacySeeder;
use Database\Seeders\EntidadFederativaSeeder;
use Database\Seeders\EstadoCatalogoSeeder;
use Database\Seeders\FirmaConfiguracionSeeder;
use Database\Seeders\MunicipioSeeder;
use Database\Seeders\MotorDocumentoSeeder;
use Database\Seeders\NivelAcademicoSeeder;
use Database\Seeders\PlantillaDocumentoSeeder;
use Database\Seeders\ProveedorFirmaSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\Sistema\ConfiguracionVisualSistemaSeeder;
use Database\Seeders\SubsistemasSeeder;
use Database\Seeders\SystemMenusSeeder;
use Database\Seeders\TipoCertificacionSeeder;
use Database\Seeders\TipoDocumentoSeeder;
use Database\Seeders\XmlPlantillaSeeder;
use Illuminate\Database\Seeder;

/**
 * Catálogos institucionales y configuración base (sin alumnos ni usuarios demo).
 */
final class InstitutionalBaseSeeder extends Seeder
{
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
            SystemMenusSeeder::class,
            ConfiguracionVisualSistemaSeeder::class,
            CadenaOriginalReglaSeeder::class,
            XmlPlantillaSeeder::class,
            PlantillaDocumentoSeeder::class,
            FirmaConfiguracionSeeder::class,
            InstitucionesSedesInicialSeeder::class,
            InstitucionesLegacyBaseSeeder::class,
            InstitucionesSubsedesLegacySeeder::class,
        ]);
    }
}
