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
        Schema::create('ventanas_operacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->foreignId('region_id')->nullable()->constrained('regiones')->nullOnDelete();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('sedes')->nullOnDelete();
            $table->string('proceso', 80);
            $table->dateTime('fecha_apertura');
            $table->dateTime('fecha_cierre');
            $table->boolean('activo')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('ciclo_escolar_id');
            $table->index('subsistema_id');
            $table->index('region_id');
            $table->index('institucion_id');
            $table->index('sede_id');
            $table->index(['ciclo_escolar_id', 'proceso']);
            $table->index(['subsistema_id', 'region_id', 'institucion_id', 'sede_id'], 'ventanas_operacion_ambito_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventanas_operacion');
    }
};
