<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('career_code', 12)->nullable()->after('role');
        });

        DB::table('users')
            ->where('role', 'institutional')
            ->orderBy('id')
            ->each(function (object $user): void {
                $careerCode = DB::table('residence_expedients')
                    ->where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->value('career_code');

                if ($careerCode && array_key_exists($careerCode, config('residence.careers'))) {
                    DB::table('users')->where('id', $user->id)->update([
                        'career_code' => $careerCode,
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('career_code');
        });
    }
};