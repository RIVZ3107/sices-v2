<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE documento_versiones MODIFY COLUMN tipo ENUM('XML_ORIGINAL','XML_SELLADO','XML_FIRMADO_SEP','PDF_OFICIAL','QR','EVIDENCIA','XML_DEC_LOCAL','XML_DEC_FIRMADO_RESPONSABLE','XML_DEC_TIMBRADO_SEP','PDF_REGENERADO','PAYLOAD_DEC','CADENA_ORIGINAL_DEC') NOT NULL"
            );
        }

        Schema::table('documento_versiones', function (Blueprint $table) {
            $table->string('spec_code', 80)->nullable()->after('tipo');
            $table->string('spec_version', 20)->nullable()->after('spec_code');
            $table->foreignId('generado_por')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->dateTime('generado_en')->nullable()->after('generado_por');
        });
    }

    public function down(): void
    {
        Schema::table('documento_versiones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('generado_por');
            $table->dropColumn(['spec_code', 'spec_version', 'generado_en']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE documento_versiones MODIFY COLUMN tipo ENUM('XML_ORIGINAL','XML_SELLADO','XML_FIRMADO_SEP','PDF_OFICIAL','QR','EVIDENCIA') NOT NULL"
            );
        }
    }
};
