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
        Schema::table('repository_entries', function (Blueprint $table) {
            $table->uuid('identifier')->nullable()->unique();
            $table->text('search_title')->nullable();
            $table->text('search_summary')->nullable();
            $table->text('search_text')->nullable();
        });

        DB::table('repository_entries')->orderBy('id')->each(function (object $entry): void {
            $title = Str::lower(Str::ascii($entry->title ?? ''));
            $summary = Str::lower(Str::ascii($entry->description ?? ''));
            $searchText = Str::lower(Str::ascii(implode(' ', array_filter([
                $entry->title ?? null,
                $entry->description ?? null,
                $entry->author ?? null,
                $entry->career ?? null,
                $entry->institution ?? null,
            ]))));

            DB::table('repository_entries')->where('id', $entry->id)->update([
                'identifier' => (string) Str::uuid(),
                'search_title' => $title,
                'search_summary' => $summary,
                'search_text' => $searchText,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('repository_entries', function (Blueprint $table) {
            $table->dropUnique(['identifier']);
            $table->dropColumn(['identifier', 'search_title', 'search_summary', 'search_text']);
        });
    }
};