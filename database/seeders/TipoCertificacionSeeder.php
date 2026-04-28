<?php

namespace Database\Seeders;

use App\Enums\Certificacion\TipoCertificacion;
use Illuminate\Database\Seeder;

class TipoCertificacionSeeder extends Seeder
{
    /**
     * Tipos de certificación usados en negocio (campo tipo_certificacion nullable en documentos).
     * Sin tabla dedicada; enumeración en App\Enums\Certificacion\TipoCertificacion y config.
     */
    public function run(): void
    {
        foreach (TipoCertificacion::cases() as $tipo) {
            $this->command?->info("Tipo certificación: {$tipo->value} — {$tipo->label()}");
        }
    }
}
