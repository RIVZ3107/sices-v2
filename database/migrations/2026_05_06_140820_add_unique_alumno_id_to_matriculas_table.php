<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicados = DB::table('matriculas')
            ->select('alumno_id', DB::raw('COUNT(*) as total'))
            ->whereNull('deleted_at')
            ->groupBy('alumno_id')
            ->having('total', '>', 1)
            ->orderBy('alumno_id')
            ->limit(10)
            ->get();

        if ($duplicados->isNotEmpty()) {
            $muestra = $duplicados
                ->map(fn ($row) => "alumno_id={$row->alumno_id} total={$row->total}")
                ->implode('; ');
            throw new \RuntimeException(
                'No se puede aplicar UNIQUE en matriculas.alumno_id: existen matrículas duplicadas activas. '.
                'Ejemplos: '.$muestra.
                '. Sane el dato primero y ejecute php artisan sices:detectar-matriculas-duplicadas.'
            );
        }

        Schema::table('matriculas', function (Blueprint $table) {
            $table->unique('alumno_id', 'matriculas_alumno_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropUnique('matriculas_alumno_id_unique');
        });
    }
};
