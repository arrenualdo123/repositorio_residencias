<?php

namespace App\Http\Controllers;

use App\Models\RepositoryEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            ->paginate(15);

        return response()->json([
            'data' => $entries->getCollection()->map(fn (RepositoryEntry $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'type' => $entry->type,
                'author' => $entry->author,
                'career' => $entry->career,
                'institution' => $entry->institution,
                'year' => $entry->year,
                'meta' => collect([$entry->author, $entry->career, $entry->institution, $entry->year])
                    ->filter(fn ($value) => filled($value))
                    ->implode(' · '),
                'description' => $entry->description,
                'identifier' => $entry->identifier,
                'has_file' => !empty($entry->file_path),
                'file_name' => $entry->file_name,
                'file_url' => $entry->file_path ? url('/api/repository/'.$entry->id.'/file') : null,
            ]),
            'current_page' => $entries->currentPage(),
            'last_page' => $entries->lastPage(),
            'total' => $entries->total(),
        ]);
    }

    public function download(Request $request, RepositoryEntry $entry)
    {
        abort_unless($entry->published, 404);
        abort_unless($entry->file_path && Storage::disk('local')->exists($entry->file_path), 404, 'El archivo no está disponible.');

        $fullPath = Storage::disk('local')->path($entry->file_path);
        $displayName = $entry->file_name ?: Str::slug($entry->title).'.pdf';

        if ($request->query('preview') === '1') {
            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$displayName.'"',
            ]);
        }

        return Storage::disk('local')->download($entry->file_path, $displayName);
    }
}
