<?php

namespace App\Http\Controllers;

use App\Models\RepositoryEntry;
use Illuminate\Http\Request;

class AdminRepositoryEntryController extends Controller
{
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
        ]);

        $entry = RepositoryEntry::create([...$fields, 'published' => true]);

        return response()->json([
            'message' => 'La ficha se publicó en el repositorio.',
            'entry' => $entry,
        ], 201);
    }
}