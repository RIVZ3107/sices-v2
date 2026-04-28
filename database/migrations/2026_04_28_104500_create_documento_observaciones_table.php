<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documento_observaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            $table->enum('tipo', [
                'academica',
                'documental',
                'datos_alumno',
                'materias',
                'trayectoria',
                'institucion',
                'sistema',
            ])->default('academica');
            $table->string('seccion', 120)->nullable();
            $table->text('observacion');
            $table->enum('estado', ['pendiente', 'atendida', 'descartada'])->default('pendiente');
            $table->enum('prioridad', ['baja', 'media', 'alta', 'critica'])->default('media');
            $table->foreignId('creada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('atendida_por')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('atendida_at')->nullable();
            $table->text('respuesta')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['documento_academico_id', 'estado']);
            $table->index('creada_por');
            $table->index('atendida_por');
            $table->index('tipo');
            $table->index('prioridad');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documento_observaciones');
    }
};
