<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicadas = DB::table('matriculas')
            ->select('matricula', DB::raw('COUNT(*) as total'))
            ->whereNull('deleted_at')
            ->whereNotNull('matricula')
            ->whereRaw("TRIM(matricula) <> ''")
            ->groupBy('matricula')
            ->having('total', '>', 1)
            ->limit(10)
            ->get();

        if ($duplicadas->isNotEmpty()) {
            $muestra = $duplicadas
                ->map(fn ($row) => "{$row->matricula} ({$row->total})")
                ->implode('; ');

            throw new RuntimeException(
                'No se puede aplicar UNIQUE global en matriculas.matricula: existen claves duplicadas. ' .
                'Ejemplos: ' . $muestra . '. Corrija datos y ejecute sices:detectar-matriculas-duplicadas.'
            );
        }

        $this->dropUniqueAlumnoIdSiExiste();

        if (! $this->tieneIndiceUnico('matriculas', 'matriculas_matricula_unique')) {
            Schema::table('matriculas', function (Blueprint $table): void {
                $table->unique('matricula', 'matriculas_matricula_unique');
            });
        }
    }

    public function down(): void
    {
        if ($this->tieneIndiceUnico('matriculas', 'matriculas_matricula_unique')) {
            Schema::table('matriculas', function (Blueprint $table): void {
                $table->dropUnique('matriculas_matricula_unique');
            });
        }

        if (! $this->tieneIndiceUnico('matriculas', 'matriculas_alumno_id_unique')) {
            Schema::table('matriculas', function (Blueprint $table): void {
                $table->unique('alumno_id', 'matriculas_alumno_id_unique');
            });
        }
    }

    private function dropUniqueAlumnoIdSiExiste(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS matriculas_alumno_id_unique');

            return;
        }

        $db = DB::getDatabaseName();
        $indices = DB::table('information_schema.statistics')
            ->select('INDEX_NAME')
            ->where('TABLE_SCHEMA', $db)
            ->where('TABLE_NAME', 'matriculas')
            ->where('COLUMN_NAME', 'alumno_id')
            ->where('NON_UNIQUE', 0)
            ->pluck('INDEX_NAME')
            ->unique()
            ->values();

        if ($indices->isEmpty()) {
            return;
        }

        foreach ($indices as $indexName) {
            Schema::table('matriculas', function (Blueprint $table) use ($indexName): void {
                $table->dropUnique((string) $indexName);
            });
        }
    }

    private function tieneIndiceUnico(string $tabla, string $indice): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            $rows = DB::select("PRAGMA index_list('{$tabla}')");
            foreach ($rows as $row) {
                $name = $row->name ?? null;
                $unique = (int) ($row->unique ?? 0);
                if ($name === $indice && $unique === 1) {
                    return true;
                }
            }

            return false;
        }

        $db = DB::getDatabaseName();

        return DB::table('information_schema.statistics')
            ->where('TABLE_SCHEMA', $db)
            ->where('TABLE_NAME', $tabla)
            ->where('INDEX_NAME', $indice)
            ->where('NON_UNIQUE', 0)
            ->exists();
    }
};
