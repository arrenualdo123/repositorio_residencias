<?php

namespace App\Http\Controllers;

use App\Models\ResidenceExpedient;
use Illuminate\Http\Request;

class StudentExpedientController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'institutional', 403);

        return response()->json([
            'expedients' => $request->user()->residenceExpedients()
                ->with('documents')
                ->latest()
                ->get()
                ->map(fn (ResidenceExpedient $expedient) => $this->serialize($expedient))
                ->values(),
            'legacy_documents' => $request->user()->documents()
                ->whereNull('expedient_id')
                ->latest()
                ->get()
                ->map(fn ($document) => [
                    'id' => $document->id,
                    'identifier' => $document->identifier,
                    'title' => $document->title,
                    'detail' => 'Subido el '.$document->created_at->format('d/m/Y').' · '.strtoupper(pathinfo($document->original_name, PATHINFO_EXTENSION)).' · '.number_format($document->size / 1024).' KB',
                    'status' => $document->status,
                    'file_url' => url('/api/student/documents/'.$document->id.'/file'),
                ])
                ->values(),
            'careers' => config('residence.careers'),
            'periods' => config('residence.periods'),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'institutional', 403);

        $fields = $request->validate([
            'career_code' => ['required', 'string', 'in:'.implode(',', array_keys(config('residence.careers')))],
            'period_name' => ['required', 'string', 'in:'.implode(',', config('residence.periods'))],
            'year' => ['required', 'integer', 'min:2020', 'max:'.(now()->year + 1)],
        ]);

        $expedient = ResidenceExpedient::firstOrCreate([
            'user_id' => $request->user()->id,
            'career_code' => $fields['career_code'],
            'period' => $fields['period_name'].' '.$fields['year'],
        ]);

        return response()->json([
            'expedient' => $this->serialize($expedient->load('documents')),
        ], 201);
    }

    private function serialize(ResidenceExpedient $expedient): array
    {
        $documents = $expedient->documents->keyBy('requirement_code');
        $requirements = collect(config('residence.requirements'))
            ->map(function (array $requirement, string $code) use ($documents) {
                $document = $documents->get($code);

                return [
                    'code' => $code,
                    'title' => $requirement['title'],
                    'extensions' => $requirement['extensions'],
                    'document' => $document ? [
                        'id' => $document->id,
                        'identifier' => $document->identifier,
                        'detail' => 'Subido el '.$document->created_at->format('d/m/Y').' · '.strtoupper(pathinfo($document->original_name, PATHINFO_EXTENSION)).' · '.number_format($document->size / 1024).' KB',
                        'status' => $document->status,
                        'file_url' => url('/api/student/documents/'.$document->id.'/file'),
                    ] : null,
                ];
            })
            ->values();

        return [
            'id' => $expedient->id,
            'career_code' => $expedient->career_code,
            'career' => config('residence.careers.'.$expedient->career_code),
            'period' => $expedient->period,
            'requirements' => $requirements,
            'completed' => $requirements->whereNotNull('document')->count(),
            'total' => $requirements->count(),
        ];
    }
}