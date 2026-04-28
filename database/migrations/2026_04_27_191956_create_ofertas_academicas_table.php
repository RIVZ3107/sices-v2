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
        Schema::create('ofertas_academicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institucion_id')->constrained('instituciones')->restrictOnDelete();
            $table->foreignId('sede_id')->constrained('sedes')->restrictOnDelete();
            $table->foreignId('programa_estudio_id')->constrained('programas_estudio')->restrictOnDelete();
            $table->foreignId('plan_estudio_id')->nullable()->constrained('planes_estudio')->nullOnDelete();
            $table->foreignId('ciclo_escolar_id')->nullable()->constrained('ciclos_escolares')->nullOnDelete();
            $table->string('clave', 50);
            $table->enum('modalidad', ['escolarizada', 'mixta', 'no_escolarizada'])->default('escolarizada');
            $table->unsignedSmallInteger('capacidad')->nullable();
            $table->boolean('activo')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                ['institucion_id', 'sede_id', 'programa_estudio_id', 'plan_estudio_id', 'ciclo_escolar_id', 'clave'],
                'ofertas_academicas_unq'
            );
            $table->index('institucion_id');
            $table->index('sede_id');
            $table->index('programa_estudio_id');
            $table->index('plan_estudio_id');
            $table->index('ciclo_escolar_id');
            $table->index(['institucion_id', 'ciclo_escolar_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ofertas_academicas');
    }
};
