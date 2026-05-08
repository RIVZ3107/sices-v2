<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_materias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_estudio_id')->constrained('planes_estudio')->restrictOnDelete();
            $table->foreignId('materia_id')->nullable()->constrained('materias')->nullOnDelete();
            $table->string('clave_materia', 40);
            $table->string('nombre_materia', 180);
            $table->unsignedTinyInteger('semestre');
            $table->unsignedSmallInteger('orden')->default(1);
            $table->unsignedSmallInteger('creditos')->nullable();
            $table->boolean('obligatoria')->default(true);
            $table->string('estatus', 30)->default('activa')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['plan_estudio_id', 'clave_materia', 'semestre'], 'plan_materias_plan_clave_sem_unique');
            $table->unique(['plan_estudio_id', 'materia_id', 'semestre'], 'plan_materias_plan_materia_sem_unique');
            $table->index(['plan_estudio_id', 'semestre', 'orden'], 'plan_materias_plan_sem_orden_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_materias');
    }
};
