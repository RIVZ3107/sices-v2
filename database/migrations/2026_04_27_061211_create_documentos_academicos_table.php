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
        Schema::create('documentos_academicos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->restrictOnDelete();
            $table->foreignId('matricula_id')->nullable()->constrained('matriculas')->nullOnDelete();
            // `ofertas_academicas` se crea en una migración posterior.
            $table->unsignedBigInteger('oferta_academica_id')->nullable();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            // `regiones` se crea en una migración posterior.
            $table->unsignedBigInteger('region_id')->nullable();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('sedes')->nullOnDelete();
            $table->enum('tipo_documento', ['certificado', 'titulo', 'grado']);
            $table->string('tipo_certificacion', 50)->nullable();
            $table->string('folio_interno', 80)->nullable();
            $table->string('folio_digital_sep', 120)->nullable()->unique();
            $table->string('token_consulta_publica', 120)->nullable()->unique();
            $table->enum('estado_workflow', ['borrador', 'pendiente', 'en_revision', 'aprobado', 'rechazado', 'cancelado'])->default('borrador');
            $table->enum('estado_cadena', ['no_generada', 'generada', 'error_cadena'])->default('no_generada');
            $table->enum('estado_xml', ['no_generado', 'generado', 'sellado', 'timbrado', 'error_xml'])->default('no_generado');
            $table->enum('estado_firma', ['no_firmado', 'firmando', 'firmado', 'error_firma'])->default('no_firmado');
            $table->enum('estado_pdf', ['no_generado', 'generando', 'generado', 'error_pdf'])->default('no_generado');
            $table->dateTime('fecha_solicitud')->nullable();
            $table->dateTime('fecha_aprobacion')->nullable();
            $table->dateTime('fecha_firma')->nullable();
            $table->dateTime('fecha_pdf')->nullable();
            $table->json('snapshot_json')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tipo_documento', 'estado_workflow']);
            $table->index(['estado_cadena', 'estado_xml']);
            $table->index(['estado_firma', 'estado_pdf']);
            $table->index(['alumno_id', 'ciclo_escolar_id']);
            $table->index(['subsistema_id', 'ciclo_escolar_id']);
            $table->index(['region_id', 'ciclo_escolar_id']);
            $table->index(['institucion_id', 'ciclo_escolar_id']);
            $table->index(['sede_id', 'ciclo_escolar_id']);
            $table->index('folio_interno');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documentos_academicos');
    }
};
