<?php

namespace App\Http\Controllers;

use App\Models\RepositoryEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminRepositoryEntryController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $query = RepositoryEntry::query()->latest('id');

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(author) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(career) LIKE ?', ["%{$term}%"]);
            });
        }

        $entries = $query->paginate(20);

        return response()->json([
            'entries' => $entries->getCollection()->map(fn (RepositoryEntry $entry) => [
                'id' => $entry->id,
                'identifier' => $entry->identifier,
                'title' => $entry->title,
                'type' => $entry->type,
                'author' => $entry->author,
                'career' => $entry->career,
                'institution' => $entry->institution,
                'year' => $entry->year,
                'description' => $entry->description,
                'published' => $entry->published,
                'file_name' => $entry->file_name,
                'file_url' => $entry->file_path ? url('/api/repository/'.$entry->id.'/file') : null,
                'created_at' => $entry->created_at->format('d/m/Y'),
            ]),
            'current_page' => $entries->currentPage(),
            'last_page' => $entries->lastPage(),
            'total' => $entries->total(),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $fields = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'type' => ['required', 'in:Residencia'],
            'author' => ['nullable', 'string', 'max:200'],
            'career' => ['nullable', 'string', 'max:120'],
            'institution' => ['nullable', 'string', 'max:180'],
            'year' => ['required', 'integer', 'min:1900', 'max:2100'],
            'description' => ['nullable', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'mimes:pdf,docx', 'max:20480'],
        ]);

        $filePath = null;
        $fileName = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('public-repository', 'local');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
        }

        $entry = RepositoryEntry::create([
            'title' => $fields['title'],
            'type' => $fields['type'],
            'author' => $fields['author'] ?? null,
            'career' => $fields['career'] ?? null,
            'institution' => $fields['institution'] ?? null,
            'year' => $fields['year'],
            'description' => $fields['description'] ?? null,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'published' => true,
        ]);

        return response()->json([
            'message' => 'La ficha se publicó en el repositorio.',
            'entry' => $entry,
        ], 201);
    }

    public function destroy(Request $request, RepositoryEntry $entry)
    {
        abort_unless($request->user()->role === 'admin', 403);

        if ($entry->file_path && Storage::disk('local')->exists($entry->file_path)) {
            Storage::disk('local')->delete($entry->file_path);
        }

        $entry->delete();

        return response()->json([
            'message' => 'La ficha fue eliminada del catálogo exitosamente.',
        ]);
    }

    public function togglePublish(Request $request, RepositoryEntry $entry)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $entry->update(['published' => !$entry->published]);

        return response()->json([
            'message' => $entry->published ? 'Ficha publicada en el catálogo.' : 'Ficha ocultada del catálogo público.',
            'published' => $entry->published,
        ]);
    }
}
