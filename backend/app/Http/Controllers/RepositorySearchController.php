<?php

namespace App\Http\Controllers;

use App\Models\RepositoryEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RepositorySearchController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'title' => ['nullable', 'string', 'max:200'],
            'summary' => ['nullable', 'string', 'max:500'],
            'career' => ['nullable', 'string', 'max:120'],
            'year_from' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'year_to' => ['nullable', 'integer', 'min:1900', 'max:2100'],
        ]);

        $entries = RepositoryEntry::query()
            ->where('published', true)
            ->where('type', 'Residencia')
            ->when($filters['q'] ?? null, function ($query, $term) {
                $normalizedTerm = '%'.Str::lower(Str::ascii($term)).'%';
                $query->where('search_text', 'like', $normalizedTerm);
            })
            ->when($filters['title'] ?? null, fn ($query, $title) => $query->where('search_title', 'like', '%'.Str::lower(Str::ascii($title)).'%'))
            ->when($filters['summary'] ?? null, fn ($query, $summary) => $query->where('search_summary', 'like', '%'.Str::lower(Str::ascii($summary)).'%'))
            ->when($filters['career'] ?? null, fn ($query, $career) => $query->where('career', $career))
            ->when($filters['year_from'] ?? null, fn ($query, $year) => $query->where('year', '>=', $year))
            ->when($filters['year_to'] ?? null, fn ($query, $year) => $query->where('year', '<=', $year))
            ->orderByDesc('year')
            ->paginate(20);

        return response()->json([
            'data' => $entries->getCollection()->map(fn (RepositoryEntry $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'type' => $entry->type,
                'meta' => collect([$entry->author, $entry->career, $entry->institution, $entry->year])
                    ->filter(fn ($value) => filled($value))
                    ->implode(' · '),
                'description' => $entry->description,
                'identifier' => $entry->identifier,
                'year' => $entry->year,
            ]),
            'current_page' => $entries->currentPage(),
            'last_page' => $entries->lastPage(),
            'total' => $entries->total(),
        ]);
    }
}