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
        Schema::create('programas_estudio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nivel_academico_id')->constrained('niveles_academicos')->restrictOnDelete();
            $table->string('clave', 40)->unique();
            $table->string('nombre', 180);
            $table->string('area_conocimiento', 120)->nullable();
            $table->unsignedSmallInteger('creditos_minimos')->nullable();
            $table->unsignedSmallInteger('duracion_periodos')->nullable();
            $table->boolean('activo')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('nivel_academico_id');
            $table->index(['nivel_academico_id', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('programas_estudio');
    }
};
