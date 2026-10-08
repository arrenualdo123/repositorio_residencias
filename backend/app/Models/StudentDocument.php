<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocument extends Model
{
    protected $fillable = [
        'user_id',
        'expedient_id',
        'requirement_code',
        'identifier',
        'title',
        'original_name',
        'path',
        'mime_type',
        'size',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expedient(): BelongsTo
    {
        return $this->belongsTo(ResidenceExpedient::class, 'expedient_id');
    }

    protected static function booted(): void
    {
        static::creating(function (StudentDocument $document): void {
            $document->identifier ??= (string) \Illuminate\Support\Str::uuid();
        });
    }
}