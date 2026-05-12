<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_matricula', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('subsistema_id')->constrained('subsistemas');
            $table->foreignId('institucion_id')->constrained('instituciones');
            $table->foreignId('sede_id')->nullable()->constrained('sedes')->nullOnDelete();
            $table->foreignId('oferta_academica_id')->nullable()->constrained('ofertas_academicas')->nullOnDelete();
            $table->foreignId('programa_estudio_id')->nullable()->constrained('programas_estudio')->nullOnDelete();
            $table->foreignId('plan_estudio_id')->nullable()->constrained('planes_estudio')->nullOnDelete();
            $table->foreignId('ciclo_ingreso_id')->nullable()->constrained('ciclos_escolares')->nullOnDelete();
            $table->string('estado', 40)->index();
            $table->foreignId('solicitada_por')->constrained('users');
            $table->foreignId('revisada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('aprobada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('matricula_id')->nullable()->constrained('matriculas')->nullOnDelete();
            $table->text('observaciones')->nullable();
            $table->text('motivo_rechazo')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_matricula');
    }
};
