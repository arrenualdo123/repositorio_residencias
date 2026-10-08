<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_documents', function (Blueprint $table) {
            $table->uuid('identifier')->nullable()->unique();
        });

        DB::table('student_documents')->orderBy('id')->each(function (object $document): void {
            DB::table('student_documents')->where('id', $document->id)->update([
                'identifier' => (string) Str::uuid(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('student_documents', function (Blueprint $table) {
            $table->dropUnique(['identifier']);
            $table->dropColumn('identifier');
        });
    }
};