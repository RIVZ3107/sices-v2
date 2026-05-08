<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodos_escolares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->string('clave', 40);
            $table->string('nombre', 120);
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->string('estatus', 30)->default('activo')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['ciclo_escolar_id', 'clave'], 'periodos_escolares_ciclo_clave_unique');
        });

        Schema::create('grupos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oferta_academica_id')->nullable()->constrained('ofertas_academicas')->nullOnDelete();
            $table->string('clave', 40);
            $table->string('nombre', 120);
            $table->unsignedTinyInteger('semestre')->nullable();
            $table->string('turno', 30)->nullable();
            $table->string('estatus', 30)->default('activo')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['oferta_academica_id', 'clave'], 'grupos_oferta_clave_unique');
        });

        Schema::create('generaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oferta_academica_id')->nullable()->constrained('ofertas_academicas')->nullOnDelete();
            $table->string('clave', 40)->unique();
            $table->string('nombre', 120);
            $table->year('anio_inicio')->nullable();
            $table->year('anio_fin')->nullable();
            $table->string('estatus', 30)->default('activa')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generaciones');
        Schema::dropIfExists('grupos');
        Schema::dropIfExists('periodos_escolares');
    }
};
