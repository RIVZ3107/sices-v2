<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bajas_cambios_solicitudes', function (Blueprint $table): void {
            $table->id();
            $table->string('folio', 40)->nullable()->unique();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('matricula_id')->constrained('matriculas')->cascadeOnDelete();
            $table->foreignId('ciclo_escolar_id')->nullable()->constrained('ciclos_escolares')->nullOnDelete();
            $table->unsignedBigInteger('periodo_escolar_id')->nullable();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('sedes')->nullOnDelete();
            $table->string('tipo_cambio', 40);
            $table->string('motivo', 120);
            $table->text('descripcion')->nullable();
            $table->string('estatus', 40)->default('solicitada');
            $table->string('etapa', 40)->default('solicitud');
            $table->string('prioridad', 20)->default('media');
            $table->date('fecha_efectiva')->nullable();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->foreignId('grupo_origen_id')->nullable()->constrained('grupos')->nullOnDelete();
            $table->foreignId('grupo_destino_id')->nullable()->constrained('grupos')->nullOnDelete();
            $table->string('turno_origen', 60)->nullable();
            $table->string('turno_destino', 60)->nullable();
            $table->foreignId('oferta_origen_id')->nullable()->constrained('ofertas_academicas')->nullOnDelete();
            $table->foreignId('oferta_destino_id')->nullable()->constrained('ofertas_academicas')->nullOnDelete();
            $table->foreignId('inscripcion_periodo_id')->nullable()->constrained('inscripciones_periodo')->nullOnDelete();
            $table->text('dictamen')->nullable();
            $table->string('clasificacion_rechazo', 80)->nullable();
            $table->boolean('documentacion_completa')->default(false);
            $table->boolean('impacto_academico_alto')->default(false);
            $table->timestamp('fecha_vencimiento')->nullable();
            $table->foreignId('responsable_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('solicitado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('aplicado_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['estatus', 'etapa']);
            $table->index(['alumno_id', 'tipo_cambio', 'estatus']);
            $table->index(['institucion_id', 'created_at']);
        });

        Schema::create('bajas_cambios_historiales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('solicitud_id')->constrained('bajas_cambios_solicitudes')->cascadeOnDelete();
            $table->string('estado_anterior', 40)->nullable();
            $table->string('estado_nuevo', 40);
            $table->string('etapa_anterior', 40)->nullable();
            $table->string('etapa_nueva', 40)->nullable();
            $table->text('comentario')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['solicitud_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bajas_cambios_historiales');
        Schema::dropIfExists('bajas_cambios_solicitudes');
    }
};
