<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_documents', function (Blueprint $table) {
            $table->foreignId('expedient_id')->nullable()->after('user_id')
                ->constrained('residence_expedients')->nullOnDelete();
            $table->string('requirement_code', 50)->nullable()->after('expedient_id');
            $table->unique(['expedient_id', 'requirement_code']);
        });
    }

    public function down(): void
    {
        Schema::table('student_documents', function (Blueprint $table) {
            $table->dropUnique(['expedient_id', 'requirement_code']);
            $table->dropConstrainedForeignId('expedient_id');
            $table->dropColumn('requirement_code');
        });
    }
};