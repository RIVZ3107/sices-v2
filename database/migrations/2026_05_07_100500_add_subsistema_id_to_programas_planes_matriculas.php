<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programas_estudio', function (Blueprint $table): void {
            if (! Schema::hasColumn('programas_estudio', 'subsistema_id')) {
                $table->foreignId('subsistema_id')
                    ->nullable()
                    ->after('nivel_academico_id')
                    ->constrained('subsistemas')
                    ->nullOnDelete();
                $table->index(['subsistema_id', 'activo'], 'programas_subsistema_activo_idx');
            }
        });

        Schema::table('planes_estudio', function (Blueprint $table): void {
            if (! Schema::hasColumn('planes_estudio', 'subsistema_id')) {
                $table->foreignId('subsistema_id')
                    ->nullable()
                    ->after('programa_estudio_id')
                    ->constrained('subsistemas')
                    ->nullOnDelete();
                $table->index(['subsistema_id', 'activo'], 'planes_subsistema_activo_idx');
            }
        });

        Schema::table('matriculas', function (Blueprint $table): void {
            if (! Schema::hasColumn('matriculas', 'subsistema_id')) {
                $table->foreignId('subsistema_id')
                    ->nullable()
                    ->after('ciclo_escolar_id')
                    ->constrained('subsistemas')
                    ->nullOnDelete();
                $table->index(['subsistema_id', 'ciclo_escolar_id'], 'matriculas_subsistema_ciclo_idx');
            }
        });

        $this->rellenarSubsistemaProgramas();
        $this->rellenarSubsistemaPlanes();
        $this->rellenarSubsistemaMatriculas();
    }

    public function down(): void
    {
        Schema::table('matriculas', function (Blueprint $table): void {
            if (Schema::hasColumn('matriculas', 'subsistema_id')) {
                $table->dropIndex('matriculas_subsistema_ciclo_idx');
                $table->dropConstrainedForeignId('subsistema_id');
            }
        });

        Schema::table('planes_estudio', function (Blueprint $table): void {
            if (Schema::hasColumn('planes_estudio', 'subsistema_id')) {
                $table->dropIndex('planes_subsistema_activo_idx');
                $table->dropConstrainedForeignId('subsistema_id');
            }
        });

        Schema::table('programas_estudio', function (Blueprint $table): void {
            if (Schema::hasColumn('programas_estudio', 'subsistema_id')) {
                $table->dropIndex('programas_subsistema_activo_idx');
                $table->dropConstrainedForeignId('subsistema_id');
            }
        });
    }

    private function rellenarSubsistemaProgramas(): void
    {
        $ambiguos = DB::table('ofertas_academicas as oa')
            ->join('instituciones as i', 'i.id', '=', 'oa.institucion_id')
            ->select('oa.programa_estudio_id')
            ->whereNotNull('oa.programa_estudio_id')
            ->groupBy('oa.programa_estudio_id')
            ->havingRaw('COUNT(DISTINCT i.subsistema_id) > 1')
            ->pluck('programa_estudio_id');

        if ($ambiguos->isNotEmpty()) {
            throw new RuntimeException(
                'No se puede inferir subsistema_id en programas_estudio: existen programas con ofertas en más de un subsistema. ' .
                'Programa(s): ' . $ambiguos->take(10)->implode(', ')
            );
        }

        $programas = DB::table('ofertas_academicas as oa')
            ->join('instituciones as i', 'i.id', '=', 'oa.institucion_id')
            ->whereNotNull('oa.programa_estudio_id')
            ->whereNotNull('i.subsistema_id')
            ->selectRaw('oa.programa_estudio_id as id, MIN(i.subsistema_id) as subsistema_id')
            ->groupBy('oa.programa_estudio_id')
            ->get();

        foreach ($programas as $row) {
            DB::table('programas_estudio')
                ->where('id', (int) $row->id)
                ->whereNull('subsistema_id')
                ->update(['subsistema_id' => (int) $row->subsistema_id]);
        }
    }

    private function rellenarSubsistemaPlanes(): void
    {
        $planes = DB::table('planes_estudio as p')
            ->join('programas_estudio as pe', 'pe.id', '=', 'p.programa_estudio_id')
            ->whereNull('p.subsistema_id')
            ->whereNotNull('pe.subsistema_id')
            ->select('p.id', 'pe.subsistema_id')
            ->get();

        foreach ($planes as $row) {
            DB::table('planes_estudio')
                ->where('id', (int) $row->id)
                ->whereNull('subsistema_id')
                ->update(['subsistema_id' => (int) $row->subsistema_id]);
        }
    }

    private function rellenarSubsistemaMatriculas(): void
    {
        $matriculas = DB::table('matriculas as m')
            ->join('ofertas_academicas as oa', 'oa.id', '=', 'm.oferta_academica_id')
            ->join('instituciones as i', 'i.id', '=', 'oa.institucion_id')
            ->whereNull('m.subsistema_id')
            ->whereNotNull('i.subsistema_id')
            ->select('m.id', 'i.subsistema_id')
            ->get();

        foreach ($matriculas as $row) {
            DB::table('matriculas')
                ->where('id', (int) $row->id)
                ->whereNull('subsistema_id')
                ->update(['subsistema_id' => (int) $row->subsistema_id]);
        }
    }
};
