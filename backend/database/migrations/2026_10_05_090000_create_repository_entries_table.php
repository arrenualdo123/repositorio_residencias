<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repository_entries', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type', 40)->index();
            $table->string('author')->nullable();
            $table->string('career')->nullable()->index();
            $table->string('institution')->nullable();
            $table->unsignedSmallInteger('year')->nullable()->index();
            $table->text('description')->nullable();
            $table->boolean('published')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repository_entries');
    }
};