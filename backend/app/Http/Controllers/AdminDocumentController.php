<?php

namespace App\Http\Controllers;

use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDocumentController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $documents = StudentDocument::query()
            ->with('user:id,name,email')
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (StudentDocument $document) => [
                'id' => $document->id,
                'identifier' => $document->identifier,
                'title' => $document->title,
                'student_name' => $document->user->name,
                'email' => $document->user->email,
                'status' => $document->status,
                'file_url' => url('/api/student/documents/'.$document->id.'/file'),
            ]);

        return response()->json([
            'summary' => [
                'active_students' => User::where('role', 'institutional')->count(),
                'uploaded_documents' => StudentDocument::count(),
                'documents_under_review' => StudentDocument::where('status', 'En revisión')->count(),
            ],
            'documents' => $documents,
        ]);
    }
}