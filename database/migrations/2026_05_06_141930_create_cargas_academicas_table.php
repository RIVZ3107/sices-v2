<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cargas_academicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inscripcion_periodo_id')->constrained('inscripciones_periodo')->restrictOnDelete();
            $table->foreignId('plan_materia_id')->constrained('plan_materias')->restrictOnDelete();
            $table->foreignId('materia_id')->nullable()->constrained('materias')->nullOnDelete();
            $table->string('estatus', 30)->default('activa')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['inscripcion_periodo_id', 'plan_materia_id'], 'cargas_academicas_inscripcion_plan_unique');
            $table->index(['inscripcion_periodo_id', 'estatus'], 'cargas_academicas_inscripcion_estatus_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cargas_academicas');
    }
};
