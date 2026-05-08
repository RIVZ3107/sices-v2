<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materias_cursadas', function (Blueprint $table) {
            $table->foreignId('inscripcion_periodo_id')->nullable()->after('matricula_id')->constrained('inscripciones_periodo')->nullOnDelete();
            $table->foreignId('carga_academica_id')->nullable()->after('inscripcion_periodo_id')->constrained('cargas_academicas')->nullOnDelete();
            $table->foreignId('plan_materia_id')->nullable()->after('materia_id')->constrained('plan_materias')->nullOnDelete();
            $table->decimal('calificacion_final', 5, 2)->nullable()->after('calificacion');
            $table->unsignedSmallInteger('orden')->nullable()->after('semestre');
            $table->string('tipo_evaluacion', 40)->nullable()->after('tipo');
            $table->string('estatus_acreditacion', 40)->nullable()->after('estado');

            $table->index(['matricula_id', 'inscripcion_periodo_id'], 'materias_cursadas_matricula_inscripcion_idx');
            $table->index(['carga_academica_id', 'plan_materia_id'], 'materias_cursadas_carga_plan_idx');
        });
    }

    public function down(): void
    {
        Schema::table('materias_cursadas', function (Blueprint $table) {
            $table->dropIndex('materias_cursadas_matricula_inscripcion_idx');
            $table->dropIndex('materias_cursadas_carga_plan_idx');
            $table->dropConstrainedForeignId('inscripcion_periodo_id');
            $table->dropConstrainedForeignId('carga_academica_id');
            $table->dropConstrainedForeignId('plan_materia_id');
            $table->dropColumn(['calificacion_final', 'orden', 'tipo_evaluacion', 'estatus_acreditacion']);
        });
    }
};
