<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inscripciones_periodo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matricula_id')->constrained('matriculas')->restrictOnDelete();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->foreignId('periodo_escolar_id')->nullable()->constrained('periodos_escolares')->nullOnDelete();
            $table->foreignId('grupo_id')->nullable()->constrained('grupos')->nullOnDelete();
            $table->unsignedTinyInteger('semestre');
            $table->string('estatus', 30)->default('inscrita')->index();
            $table->date('fecha_inscripcion')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(
                ['matricula_id', 'ciclo_escolar_id', 'periodo_escolar_id', 'semestre'],
                'inscripciones_periodo_unq'
            );
            $table->index(['matricula_id', 'ciclo_escolar_id'], 'inscripciones_periodo_matricula_ciclo_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inscripciones_periodo');
    }
};
