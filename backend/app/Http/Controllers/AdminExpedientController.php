<?php

namespace App\Http\Controllers;

use App\Models\ResidenceExpedient;
use App\Models\StudentDocument;
use App\Models\RepositoryEntry;
use Illuminate\Http\Request;

class AdminExpedientController extends Controller
{
    /**
     * Listar expedientes filtrados por carrera, periodo y año.
     */
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $filters = $request->validate([
            'career_code' => ['nullable', 'string'],
            'period_name' => ['nullable', 'string'],
            'year'        => ['nullable', 'integer'],
            'search'      => ['nullable', 'string'],
        ]);

        $query = ResidenceExpedient::query()
            ->with(['user:id,name,email,career_code', 'documents'])
            ->latest();

        if (!empty($filters['career_code'])) {
            $query->where('career_code', $filters['career_code']);
        }

        if (!empty($filters['period_name']) && !empty($filters['year'])) {
            $query->where('period', $filters['period_name'].' '.$filters['year']);
        } elseif (!empty($filters['year'])) {
            $query->where('period', 'like', '%'.$filters['year'].'%');
        }

        if (!empty($filters['search'])) {
            $term = strtolower($filters['search']);
            $query->whereHas('user', function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$term}%"]);
            });
        }

        $expedients = $query->get()->map(function (ResidenceExpedient $expedient) {
            $requirementsConfig = config('residence.requirements', []);
            $documentsByRequirement = $expedient->documents->keyBy('requirement_code');

            $requirements = collect($requirementsConfig)->map(function ($config, $code) use ($documentsByRequirement) {
                $doc = $documentsByRequirement->get($code);
                return [
                    'code'        => $code,
                    'title'       => $config['title'],
                    'extensions'  => $config['extensions'],
                    'document'    => $doc ? [
                        'id'          => $doc->id,
                        'identifier'  => $doc->identifier,
                        'title'       => $doc->title,
                        'detail'      => 'Subido el '.$doc->created_at->format('d/m/Y').' · '.strtoupper(pathinfo($doc->original_name, PATHINFO_EXTENSION)).' · '.number_format($doc->size / 1024).' KB',
                        'status'      => $doc->status,
                        'feedback'    => $doc->feedback,
                        'original_name' => $doc->original_name,
                        'file_url'    => url('/api/student/documents/'.$doc->id.'/file'),
                        'uploaded_at' => $doc->created_at->format('d/m/Y H:i'),
                    ] : null,
                ];
            })->values();

            $completed = $expedient->documents->count();
            $approved  = $expedient->documents->where('status', 'Aprobado')->count();

            return [
                'id'           => $expedient->id,
                'student_id'   => $expedient->user_id,
                'student_name' => $expedient->user->name,
                'student_email'=> $expedient->user->email,
                'career_code'  => $expedient->career_code,
                'career_name'  => config('residence.careers.'.$expedient->career_code, $expedient->career_code),
                'period'       => $expedient->period,
                'completed'    => $completed,
                'approved'     => $approved,
                'total'        => count($requirementsConfig),
                'requirements' => $requirements,
            ];
        });

        return response()->json([
            'expedients' => $expedients,
            'careers'    => config('residence.careers'),
            'periods'    => config('residence.periods'),
        ]);
    }

    /**
     * Calificar documento: Aprobar o Rechazar con observaciones.
     */
    public function reviewDocument(Request $request, StudentDocument $document)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $fields = $request->validate([
            'status'   => ['required', 'string', 'in:Aprobado,Rechazado,En revisión'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $document->update([
            'status'   => $fields['status'],
            'feedback' => $fields['feedback'] ?? null,
        ]);

        return response()->json([
            'message'  => 'Documento evaluado correctamente.',
            'document' => [
                'id'       => $document->id,
                'status'   => $document->status,
                'feedback' => $document->feedback,
            ],
        ]);
    }

    /**
     * Publicar informe técnico aprobado directamente en el catálogo público.
     */
    public function publishApprovedReport(Request $request, ResidenceExpedient $expedient)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $reportDoc = $expedient->documents()
            ->whereIn('requirement_code', ['technical-report-pdf', 'technical-report-docx'])
            ->where('status', 'Aprobado')
            ->first();

        if (!$reportDoc) {
            return response()->json([
                'message' => 'El informe técnico debe estar aprobado antes de ser publicado en el catálogo.',
            ], 422);
        }

        $fields = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'year'        => ['required', 'integer', 'min:1990', 'max:2100'],
        ]);

        $entry = RepositoryEntry::create([
            'title'       => $fields['title'],
            'type'        => 'Residencia',
            'author'      => $expedient->user->name,
            'career'      => config('residence.careers.'.$expedient->career_code, $expedient->career_code),
            'institution' => 'TecNM Campus La Huerta',
            'year'        => $fields['year'],
            'description' => $fields['description'] ?? '',
            'published'   => true,
        ]);

        return response()->json([
            'message' => 'Ficha publicada exitosamente en el catálogo público.',
            'entry'   => $entry,
        ], 201);
    }
}