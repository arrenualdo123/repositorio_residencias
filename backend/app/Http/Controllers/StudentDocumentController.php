<?php

namespace App\Http\Controllers;

use App\Models\StudentDocument;
use App\Models\ResidenceExpedient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class StudentDocumentController extends Controller
{
    public function index(Request $request)
    {
        $documents = $request->user()->documents()
            ->latest()
            ->get()
            ->map(fn (StudentDocument $document) => $this->serialize($document));

        return response()->json(['documents' => $documents]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'institutional', 403);

        $fields = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $file = $fields['file'];
        $path = $file->store('student-documents/'.$request->user()->id, 'local');

        if (!$path) {
            throw ValidationException::withMessages([
                'file' => ['No se pudo guardar el archivo. Inténtalo de nuevo.'],
            ]);
        }

        $document = $request->user()->documents()->create([
            'title' => $fields['title'],
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType() ?: 'application/pdf',
            'size' => $file->getSize(),
            'status' => 'Recibido',
        ]);

        return response()->json(['document' => $this->serialize($document)], 201);
    }

    public function storeForRequirement(Request $request, ResidenceExpedient $expedient)
    {
        abort_unless($request->user()->role === 'institutional', 403);
        abort_unless($request->user()->id === $expedient->user_id, 404);

        $fields = $request->validate([
            'requirement_code' => ['required', 'string', 'in:'.implode(',', array_keys(config('residence.requirements')))],
            'file' => ['required', 'file', 'mimes:pdf,docx', 'max:10240'],
        ]);

        $requirement = config('residence.requirements.'.$fields['requirement_code']);
        $file = $fields['file'];
        $extension = strtolower($file->getClientOriginalExtension());

        abort_unless(in_array($extension, $requirement['extensions'], true), 422, 'El formato del archivo no corresponde a este requisito.');

        $path = $file->store('student-documents/'.$request->user()->id.'/'.$expedient->id, 'local');

        if (!$path) {
            throw ValidationException::withMessages([
                'file' => ['No se pudo guardar el archivo. Inténtalo de nuevo.'],
            ]);
        }

        $document = StudentDocument::firstOrNew([
            'expedient_id' => $expedient->id,
            'requirement_code' => $fields['requirement_code'],
        ]);
        $previousPath = $document->path;
        $document->fill([
            'user_id' => $request->user()->id,
            'title' => $requirement['title'],
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'size' => $file->getSize(),
            'status' => 'Recibido',
        ])->save();

        if ($previousPath) {
            Storage::disk('local')->delete($previousPath);
        }

        return response()->json(['document' => $this->serialize($document)], 201);
    }

    public function download(Request $request, StudentDocument $document)
    {
        abort_unless(
            $request->user()->id === $document->user_id || $request->user()->role === 'admin',
            404,
        );

        abort_unless(Storage::disk('local')->exists($document->path), 404);

        return Storage::disk('local')->download($document->path, $document->original_name);
    }

    private function serialize(StudentDocument $document): array
    {
        return [
            'id' => $document->id,
            'identifier' => $document->identifier,
            'title' => $document->title,
            'detail' => 'Subido el '.$document->created_at->format('d/m/Y').' · '.strtoupper(pathinfo($document->original_name, PATHINFO_EXTENSION)).' · '.number_format($document->size / 1024).' KB',
            'status' => $document->status,
            'file_url' => url('/api/student/documents/'.$document->id.'/file'),
        ];
    }
}