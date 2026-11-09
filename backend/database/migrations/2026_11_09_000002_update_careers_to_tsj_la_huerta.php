<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migrar claves de carrera en usuarios y expedientes
        DB::table('users')->where('career_code', 'IADM')->update(['career_code' => 'LA']);
        DB::table('users')->where('career_code', 'COPU')->update(['career_code' => 'LCP']);

        DB::table('residence_expedients')->where('career_code', 'IADM')->update(['career_code' => 'LA']);
        DB::table('residence_expedients')->where('career_code', 'COPU')->update(['career_code' => 'LCP']);

        // Migrar nombres en el catálogo público
        DB::table('repository_entries')->where('career', 'Ingeniería en Administración')->update(['career' => 'Licenciatura en Administración']);
        DB::table('repository_entries')->where('career', 'Contador Público')->update(['career' => 'Licenciatura en Contador Público']);
    }

    public function down(): void
    {
        DB::table('users')->where('career_code', 'LA')->update(['career_code' => 'IADM']);
        DB::table('users')->where('career_code', 'LCP')->update(['career_code' => 'COPU']);

        DB::table('residence_expedients')->where('career_code', 'LA')->update(['career_code' => 'IADM']);
        DB::table('residence_expedients')->where('career_code', 'LCP')->update(['career_code' => 'COPU']);

        DB::table('repository_entries')->where('career', 'Licenciatura en Administración')->update(['career' => 'Ingeniería en Administración']);
        DB::table('repository_entries')->where('career', 'Licenciatura en Contador Público')->update(['career' => 'Contador Público']);
    }
};
