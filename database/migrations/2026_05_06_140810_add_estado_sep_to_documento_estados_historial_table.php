<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE documento_estados_historial MODIFY COLUMN campo ENUM('estado_workflow','estado_cadena','estado_xml','estado_firma','estado_sep','estado_pdf') NOT NULL"
            );
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE documento_estados_historial MODIFY COLUMN campo ENUM('estado_workflow','estado_cadena','estado_xml','estado_firma','estado_pdf') NOT NULL"
            );
        }
    }
};
