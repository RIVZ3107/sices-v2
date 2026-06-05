<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periodos_escolares', function (Blueprint $table) {
            $table->string('tipo_periodo', 40)->default('semestre')->after('nombre');
            $table->unsignedTinyInteger('numero_periodo')->default(1)->after('tipo_periodo');
            $table->date('fecha_inicio_inscripcion')->nullable()->after('fecha_fin');
            $table->date('fecha_fin_inscripcion')->nullable()->after('fecha_inicio_inscripcion');
            $table->date('fecha_inicio_calificaciones')->nullable()->after('fecha_fin_inscripcion');
            $table->date('fecha_fin_calificaciones')->nullable()->after('fecha_inicio_calificaciones');
            $table->boolean('activo')->default(true)->after('estatus');
            $table->softDeletes();
        });

        DB::table('periodos_escolares')->where('estatus', '!=', 'activo')->update(['activo' => false]);

        Schema::table('periodos_escolares', function (Blueprint $table) {
            $table->unique(
                ['ciclo_escolar_id', 'tipo_periodo', 'numero_periodo'],
                'periodos_escolares_ciclo_tipo_num_unique',
            );
            $table->index(['ciclo_escolar_id', 'activo'], 'periodos_escolares_ciclo_activo_idx');
        });
    }

    public function down(): void
    {
        Schema::table('periodos_escolares', function (Blueprint $table) {
            $table->dropUnique('periodos_escolares_ciclo_tipo_num_unique');
            $table->dropIndex('periodos_escolares_ciclo_activo_idx');
            $table->dropSoftDeletes();
            $table->dropColumn([
                'tipo_periodo',
                'numero_periodo',
                'fecha_inicio_inscripcion',
                'fecha_fin_inscripcion',
                'fecha_inicio_calificaciones',
                'fecha_fin_calificaciones',
                'activo',
            ]);
        });
    }
};
