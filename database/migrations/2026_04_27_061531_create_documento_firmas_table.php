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
        Schema::create('documento_firmas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            $table->foreignId('documento_version_id')->nullable()->constrained('documento_versiones')->nullOnDelete();
            // `firma_configuraciones` y `firmantes_autorizados` se crean en migraciones posteriores.
            $table->unsignedBigInteger('firma_configuracion_id')->nullable();
            $table->unsignedBigInteger('firmante_autorizado_id')->nullable();
            $table->enum('proveedor', ['SEP_SINCE_SERVICE', 'SIMULADO', 'OTRO'])->default('SIMULADO');
            $table->string('endpoint', 255)->nullable();
            $table->enum('estado', ['pendiente', 'enviado', 'firmado', 'error', 'reintentando', 'cancelado'])->default('pendiente');
            $table->string('folio_digital_sep', 120)->nullable();
            $table->longText('xml_firmado')->nullable();
            $table->string('correlation_id', 120);
            $table->string('idempotency_key', 120)->unique();
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->text('error_message')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('signed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['documento_academico_id', 'estado']);
            $table->index('documento_version_id');
            $table->index('firma_configuracion_id');
            $table->index('firmante_autorizado_id');
            $table->index('folio_digital_sep');
            $table->index('correlation_id');
            $table->index(['proveedor', 'estado']);
            $table->index('sent_at');
            $table->index('signed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documento_firmas');
    }
};
