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
        Schema::create('integraciones_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->nullable()->constrained('documentos_academicos')->nullOnDelete();
            $table->enum('tipo', ['FIRMA_SEP', 'XML_GENERATION', 'PDF_GENERATION', 'JASPER_RENDER', 'QR_GENERATION', 'STORAGE', 'EMAIL', 'WEBHOOK']);
            $table->string('endpoint', 255)->nullable();
            $table->string('method', 10)->nullable();
            $table->string('correlation_id', 120);
            $table->string('idempotency_key', 120)->nullable();
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->enum('estado', ['REQUESTED', 'SUCCESS', 'FAILED', 'RETRYING', 'CANCELLED'])->default('REQUESTED');
            $table->text('error_message')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('documento_academico_id');
            $table->index(['tipo', 'estado']);
            $table->index('correlation_id');
            $table->index('idempotency_key');
            $table->index('http_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integraciones_logs');
    }
};
