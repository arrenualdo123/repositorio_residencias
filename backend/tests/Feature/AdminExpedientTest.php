<?php

namespace Tests\Feature;

use App\Models\ResidenceExpedient;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminExpedientTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_expedients_and_filter(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create([
            'role' => 'institutional',
            'career_code' => 'ISC',
        ]);

        $expedient = ResidenceExpedient::create([
            'user_id' => $student->id,
            'career_code' => 'ISC',
            'period' => 'Ago-Dic 2026',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/expedients?career_code=ISC&year=2026');

        $response->assertOk()
            ->assertJsonCount(1, 'expedients')
            ->assertJsonPath('expedients.0.student_name', $student->name)
            ->assertJsonPath('expedients.0.career_code', 'ISC')
            ->assertJsonPath('expedients.0.period', 'Ago-Dic 2026');
    }

    public function test_non_admin_cannot_list_expedients(): void
    {
        $student = User::factory()->create(['role' => 'institutional']);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/admin/expedients')
            ->assertForbidden();
    }

    public function test_admin_can_review_and_reject_document_with_feedback(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'institutional', 'career_code' => 'ISC']);

        $expedient = ResidenceExpedient::create([
            'user_id' => $student->id,
            'career_code' => 'ISC',
            'period' => 'Ago-Dic 2026',
        ]);

        $document = StudentDocument::create([
            'user_id' => $student->id,
            'expedient_id' => $expedient->id,
            'requirement_code' => 'report-cover',
            'title' => '1 — Portada de informe técnico',
            'original_name' => 'portada.pdf',
            'path' => 'fake/path/portada.pdf',
            'mime_type' => 'application/pdf',
            'size' => 1024,
            'status' => 'Recibido',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/admin/documents/'.$document->id.'/review', [
                'status' => 'Rechazado',
                'feedback' => 'Falta la firma del asesor interno.',
            ]);

        $response->assertOk()
            ->assertJsonPath('document.status', 'Rechazado')
            ->assertJsonPath('document.feedback', 'Falta la firma del asesor interno.');

        $this->assertDatabaseHas('student_documents', [
            'id' => $document->id,
            'status' => 'Rechazado',
            'feedback' => 'Falta la firma del asesor interno.',
        ]);
    }

    public function test_admin_can_publish_approved_technical_report_to_repository(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'institutional', 'career_code' => 'ISC']);

        $expedient = ResidenceExpedient::create([
            'user_id' => $student->id,
            'career_code' => 'ISC',
            'period' => 'Ago-Dic 2026',
        ]);

        StudentDocument::create([
            'user_id' => $student->id,
            'expedient_id' => $expedient->id,
            'requirement_code' => 'technical-report-pdf',
            'title' => 'Informe técnico de residencia',
            'original_name' => 'informe.pdf',
            'path' => 'fake/path/informe.pdf',
            'mime_type' => 'application/pdf',
            'size' => 2048,
            'status' => 'Aprobado',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/expedients/'.$expedient->id.'/publish-report', [
                'title' => 'Sistema de Gestión Hospitalaria',
                'description' => 'Desarrollo de plataforma web...',
                'year' => 2026,
            ]);

        $response->assertCreated()
            ->assertJsonPath('entry.title', 'Sistema de Gestión Hospitalaria')
            ->assertJsonPath('entry.author', $student->name)
            ->assertJsonPath('entry.published', true);

        $this->assertDatabaseHas('repository_entries', [
            'title' => 'Sistema de Gestión Hospitalaria',
            'author' => $student->name,
            'published' => true,
        ]);
    }
}

