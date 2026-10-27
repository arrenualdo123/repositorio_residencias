<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('career_code', 'ISIC')->update(['career_code' => 'ISC']);
        DB::table('residence_expedients')->where('career_code', 'ISIC')->update(['career_code' => 'ISC']);
    }

    public function down(): void
    {
        DB::table('users')->where('career_code', 'ISC')->update(['career_code' => 'ISIC']);
        DB::table('residence_expedients')->where('career_code', 'ISC')->update(['career_code' => 'ISIC']);
    }
};
