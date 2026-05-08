<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documento_materias_snapshot', function (Blueprint $table) {
            $table->dropUnique('doc_materias_snapshot_doc_clave_sem_periodo_unq');
        });

        Schema::table('documento_materias_snapshot', function (Blueprint $table) {
            $table->string('tipo_periodo_curricular', 40)->nullable()->after('calificacion_final');
            $table->unsignedTinyInteger('numero_periodo_curricular')->nullable()->after('tipo_periodo_curricular');
            $table->string('etiqueta_periodo_curricular', 120)->nullable()->after('numero_periodo_curricular');
        });

        Schema::table('documento_materias_snapshot', function (Blueprint $table) {
            $table->unique(
                [
                    'documento_academico_id',
                    'clave',
                    'tipo_periodo_curricular',
                    'numero_periodo_curricular',
                    'periodo',
                    'semestre',
                ],
                'doc_materias_snapshot_natural_unq',
            );
        });
    }

    public function down(): void
    {
        Schema::table('documento_materias_snapshot', function (Blueprint $table) {
            $table->dropUnique('doc_materias_snapshot_natural_unq');
        });

        Schema::table('documento_materias_snapshot', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_periodo_curricular',
                'numero_periodo_curricular',
                'etiqueta_periodo_curricular',
            ]);
        });

        Schema::table('documento_materias_snapshot', function (Blueprint $table) {
            $table->unique(
                ['documento_academico_id', 'clave', 'semestre', 'periodo'],
                'doc_materias_snapshot_doc_clave_sem_periodo_unq',
            );
        });
    }
};
