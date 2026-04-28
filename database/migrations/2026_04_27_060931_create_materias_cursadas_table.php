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
        Schema::create('materias_cursadas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->restrictOnDelete();
            $table->foreignId('matricula_id')->constrained('matriculas')->restrictOnDelete();
            $table->foreignId('materia_id')->nullable()->constrained('materias')->nullOnDelete();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->string('clave', 40);
            $table->string('nombre', 180);
            $table->decimal('calificacion', 5, 2)->nullable();
            $table->string('calificacion_texto', 40)->nullable();
            $table->string('periodo', 40)->nullable();
            $table->unsignedTinyInteger('semestre')->nullable();
            $table->unsignedSmallInteger('creditos')->nullable();
            $table->string('tipo', 50)->nullable();
            $table->string('estado', 30)->default('cursada')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['alumno_id', 'ciclo_escolar_id']);
            $table->index(['matricula_id', 'ciclo_escolar_id']);
            $table->index('materia_id');
            $table->index('clave');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materias_cursadas');
    }
};
