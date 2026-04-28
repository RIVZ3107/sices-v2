<?php

namespace Database\Seeders;

use App\Enums\Certificacion\TipoDocumentoAcademico;
use Illuminate\Database\Seeder;

class TipoDocumentoSeeder extends Seeder
{
    /**
     * Tipos de documento académico viven como enum y columna enum en migraciones.
     * No hay tabla catálogo dedicada; valores en config/certificacion.php tipos_documento.
     */
    public function run(): void
    {
        foreach (TipoDocumentoAcademico::cases() as $tipo) {
            $this->command?->info("Tipo documento: {$tipo->value} — {$tipo->label()}");
        }
    }
}
