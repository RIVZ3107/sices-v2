<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trayectorias_academicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->restrictOnDelete();
            $table->foreignId('matricula_id')->constrained('matriculas')->restrictOnDelete();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->decimal('promedio', 5, 2)->nullable();
            $table->string('promedio_texto', 40)->nullable();
            $table->unsignedSmallInteger('creditos_obtenidos')->nullable();
            $table->unsignedSmallInteger('creditos_totales')->nullable();
            $table->unsignedSmallInteger('total_materias')->nullable();
            $table->unsignedSmallInteger('materias_aprobadas')->nullable();
            $table->unsignedSmallInteger('materias_reprobadas')->nullable();
            $table->string('estado', 30)->default('activa')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['alumno_id', 'matricula_id']);
            $table->index('alumno_id');
            $table->index('matricula_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trayectorias_academicas');
    }
};
