<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_materias', function (Blueprint $table) {
            $table->string('tipo_periodo_curricular', 40)->default('semestre')->after('semestre');
            $table->unsignedTinyInteger('numero_periodo_curricular')->nullable()->after('tipo_periodo_curricular');
            $table->string('etiqueta_periodo_curricular', 120)->nullable()->after('numero_periodo_curricular');
        });

        DB::table('plan_materias')->whereNull('numero_periodo_curricular')->update([
            'numero_periodo_curricular' => DB::raw('semestre'),
            'tipo_periodo_curricular' => DB::raw("'semestre'"),
        ]);

        Schema::table('plan_materias', function (Blueprint $table) {
            $table->dropUnique('plan_materias_plan_clave_sem_unique');
            $table->dropUnique('plan_materias_plan_materia_sem_unique');
            $table->unique(
                ['plan_estudio_id', 'clave_materia', 'tipo_periodo_curricular', 'numero_periodo_curricular'],
                'plan_materias_plan_clave_periodo_unique',
            );
            $table->unique(
                ['plan_estudio_id', 'materia_id', 'tipo_periodo_curricular', 'numero_periodo_curricular'],
                'plan_materias_plan_materia_periodo_unique',
            );
            $table->index(['plan_estudio_id', 'tipo_periodo_curricular', 'numero_periodo_curricular', 'orden'], 'plan_materias_plan_periodo_orden_idx');
        });

        Schema::table('inscripciones_periodo', function (Blueprint $table) {
            $table->string('tipo_periodo_curricular', 40)->default('semestre')->after('semestre');
            $table->unsignedTinyInteger('numero_periodo_curricular')->nullable()->after('tipo_periodo_curricular');
            $table->string('etiqueta_periodo_curricular', 120)->nullable()->after('numero_periodo_curricular');
        });

        DB::table('inscripciones_periodo')->whereNull('numero_periodo_curricular')->update([
            'numero_periodo_curricular' => DB::raw('semestre'),
            'tipo_periodo_curricular' => DB::raw("'semestre'"),
        ]);

        Schema::table('inscripciones_periodo', function (Blueprint $table) {
            $table->dropUnique('inscripciones_periodo_unq');
            $table->unique(
                ['matricula_id', 'ciclo_escolar_id', 'periodo_escolar_id', 'tipo_periodo_curricular', 'numero_periodo_curricular'],
                'inscripciones_periodo_periodo_curricular_unq',
            );
        });

        Schema::table('materias_cursadas', function (Blueprint $table) {
            $table->string('tipo_periodo_curricular', 40)->nullable()->after('semestre');
            $table->unsignedTinyInteger('numero_periodo_curricular')->nullable()->after('tipo_periodo_curricular');
            $table->string('etiqueta_periodo_curricular', 120)->nullable()->after('numero_periodo_curricular');
        });
    }

    public function down(): void
    {
        Schema::table('materias_cursadas', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_periodo_curricular',
                'numero_periodo_curricular',
                'etiqueta_periodo_curricular',
            ]);
        });

        Schema::table('inscripciones_periodo', function (Blueprint $table) {
            $table->dropUnique('inscripciones_periodo_periodo_curricular_unq');
        });

        Schema::table('inscripciones_periodo', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_periodo_curricular',
                'numero_periodo_curricular',
                'etiqueta_periodo_curricular',
            ]);
        });

        Schema::table('inscripciones_periodo', function (Blueprint $table) {
            $table->unique(
                ['matricula_id', 'ciclo_escolar_id', 'periodo_escolar_id', 'semestre'],
                'inscripciones_periodo_unq',
            );
        });

        Schema::table('plan_materias', function (Blueprint $table) {
            $table->dropUnique('plan_materias_plan_clave_periodo_unique');
            $table->dropUnique('plan_materias_plan_materia_periodo_unique');
            $table->dropIndex('plan_materias_plan_periodo_orden_idx');
        });

        Schema::table('plan_materias', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_periodo_curricular',
                'numero_periodo_curricular',
                'etiqueta_periodo_curricular',
            ]);
        });

        Schema::table('plan_materias', function (Blueprint $table) {
            $table->unique(['plan_estudio_id', 'clave_materia', 'semestre'], 'plan_materias_plan_clave_sem_unique');
            $table->unique(['plan_estudio_id', 'materia_id', 'semestre'], 'plan_materias_plan_materia_sem_unique');
        });
    }
};
