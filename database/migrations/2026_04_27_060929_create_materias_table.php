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
        Schema::create('materias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_estudio_id')->constrained('planes_estudio')->restrictOnDelete();
            $table->string('clave', 40);
            $table->string('nombre', 180);
            $table->unsignedSmallInteger('creditos')->nullable();
            $table->unsignedTinyInteger('semestre')->nullable();
            $table->unsignedSmallInteger('orden')->nullable();
            $table->string('tipo', 50)->nullable();
            $table->string('estatus', 30)->default('activo')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['plan_estudio_id', 'clave']);
            $table->index('plan_estudio_id');
            $table->index('clave');
            $table->index(['plan_estudio_id', 'semestre']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materias');
    }
};
