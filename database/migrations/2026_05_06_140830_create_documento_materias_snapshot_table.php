<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documento_materias_snapshot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            $table->foreignId('materia_cursada_id')->nullable()->constrained('materias_cursadas')->nullOnDelete();
            $table->string('clave', 40);
            $table->string('nombre', 180);
            $table->decimal('calificacion_final', 5, 2)->nullable();
            $table->unsignedTinyInteger('semestre')->nullable();
            $table->string('periodo', 40)->nullable();
            $table->unsignedSmallInteger('creditos')->nullable();
            $table->unsignedInteger('orden')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(
                ['documento_academico_id', 'clave', 'semestre', 'periodo'],
                'doc_materias_snapshot_doc_clave_sem_periodo_unq'
            );
            $table->index(['documento_academico_id', 'materia_cursada_id'], 'doc_materias_snapshot_doc_materia_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documento_materias_snapshot');
    }
};
