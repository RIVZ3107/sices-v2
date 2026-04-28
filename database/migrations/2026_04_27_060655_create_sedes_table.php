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
        Schema::create('sedes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institucion_id')->constrained('instituciones')->restrictOnDelete();
            // Se declara como columna simple porque `regiones` se crea en una migración posterior.
            $table->unsignedBigInteger('region_id')->nullable();
            $table->string('clave', 40);
            $table->string('nombre', 180);
            $table->string('nombre_corto', 60)->nullable();
            $table->string('tipo_sede', 50)->nullable();
            $table->string('codigo_postal', 10)->nullable();
            $table->string('domicilio', 255)->nullable();
            $table->boolean('activo')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['institucion_id', 'clave']);
            $table->index('institucion_id');
            $table->index('region_id');
            $table->index(['institucion_id', 'region_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sedes');
    }
};
