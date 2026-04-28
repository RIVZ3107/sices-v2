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
        Schema::create('matriculas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->restrictOnDelete();
            // `ofertas_academicas` se crea en una migración posterior.
            $table->unsignedBigInteger('oferta_academica_id');
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->string('matricula', 50)->nullable();
            $table->string('estado', 30)->default('activa')->index();
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_egreso')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['oferta_academica_id', 'matricula']);
            $table->index('alumno_id');
            $table->index('oferta_academica_id');
            $table->index('ciclo_escolar_id');
            $table->index(['alumno_id', 'ciclo_escolar_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matriculas');
    }
};
