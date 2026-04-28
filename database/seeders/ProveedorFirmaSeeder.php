<?php

namespace Database\Seeders;

use App\Enums\Certificacion\ProveedorFirma;
use Illuminate\Database\Seeder;

class ProveedorFirmaSeeder extends Seeder
{
    /**
     * Proveedores de firma reconocidos por el motor (columna proveedor en firma_configuraciones).
     * FirmaConfiguracionSeeder crea registros SIMULADO sin endpoints reales.
     */
    public function run(): void
    {
        foreach (ProveedorFirma::cases() as $proveedor) {
            $this->command?->info("Proveedor firma: {$proveedor->value} — {$proveedor->label()}");
        }
    }
}
