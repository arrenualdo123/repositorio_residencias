<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RepositoryEntry extends Model
{
    protected $fillable = [
        'title',
        'identifier',
        'type',
        'author',
        'career',
        'institution',
        'year',
        'description',
        'search_text',
        'search_title',
        'search_summary',
        'published',
    ];

    protected function casts(): array
    {
        return ['published' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::saving(function (RepositoryEntry $entry): void {
            $entry->search_title = Str::lower(Str::ascii($entry->title ?? ''));
            $entry->search_summary = Str::lower(Str::ascii($entry->description ?? ''));
            $entry->search_text = Str::lower(Str::ascii(implode(' ', array_filter([
                $entry->title,
                $entry->description,
                $entry->author,
                $entry->career,
                $entry->institution,
            ]))));
        });

        static::creating(function (RepositoryEntry $entry): void {
            $entry->identifier ??= (string) Str::uuid();
        });
    }
}