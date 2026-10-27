<?php

namespace Tests\Feature;

use App\Models\RepositoryEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RepositoryAndDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_search_only_returns_residences_and_matches_accents_in_metadata(): void
    {
        RepositoryEntry::create([
            'title' => 'Automatización industrial',
            'type' => 'Residencia',
            'career' => 'Ingeniería Industrial',
            'description' => 'Aplicación de informática en procesos productivos',
            'year' => 2024,
            'published' => true,
        ]);
        RepositoryEntry::create([
            'title' => 'Residencia de informática',
            'type' => 'Tesis',
            'description' => 'Automatización industrial',
            'year' => 2024,
            'published' => true,
        ]);
        RepositoryEntry::create([
            'title' => 'Residencia no publicada',
            'type' => 'Residencia',
            'year' => 2024,
            'published' => false,
        ]);

        $this->getJson('/api/repository/search?q=informatica&year_from=2020&year_to=2025')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.title', 'Automatización industrial')
            ->assertJsonStructure(['data' => [['identifier']]]);
    }

    public function test_institutional_student_can_upload_private_pdf_and_another_student_cannot_download_it(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create(['role' => 'institutional']);
        $otherStudent = User::factory()->create(['role' => 'institutional']);

        $upload = $this->actingAs($owner, 'sanctum')->postJson('/api/student/documents', [
            'title' => 'Carta de aceptación',
            'file' => UploadedFile::fake()->create('carta.pdf', 100, 'application/pdf'),
        ]);

        $upload->assertCreated()
            ->assertJsonPath('document.title', 'Carta de aceptación');

        $documentId = $upload->json('document.id');
        $documentPath = $owner->documents()->findOrFail($documentId)->path;
        Storage::disk('local')->assertExists($documentPath);

        $this->actingAs($otherStudent, 'sanctum')
            ->get('/api/student/documents/'.$documentId.'/file')
            ->assertNotFound();
    }

    public function test_reader_cannot_upload_student_documents(): void
    {
        Storage::fake('local');
        $reader = User::factory()->create(['role' => 'reader']);

        $this->actingAs($reader, 'sanctum')
            ->postJson('/api/student/documents', [
                'title' => 'Carta de aceptación',
                'file' => UploadedFile::fake()->create('carta.pdf', 100, 'application/pdf'),
            ])
            ->assertForbidden();
    }

    public function test_institutional_student_can_create_an_expedient_with_the_full_checklist(): void
    {
        $student = User::factory()->create([
            'role' => 'institutional',
            'career_code' => 'ISC',
        ]);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/student/expedients', [
                'career_code' => 'IIND',
                'period_name' => 'Ago-Dic',
                'year' => now()->year,
            ])
            ->assertCreated()
            ->assertJsonPath('expedient.career_code', 'ISC')
            ->assertJsonPath('expedient.period', 'Ago-Dic '.now()->year)
            ->assertJsonPath('expedient.completed', 0)
            ->assertJsonPath('expedient.total', 11);
    }

    public function test_institutional_registration_requires_a_valid_career_and_stores_it_on_the_profile(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Estudiante de prueba',
            'email' => 'alumno@lahuerta.tecmm.edu.mx',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('career_code');

        $this->postJson('/api/register', [
            'name' => 'Estudiante de prueba',
            'email' => 'alumno@lahuerta.tecmm.edu.mx',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'career_code' => 'ISC',
            'role' => 'admin',
        ])->assertCreated()
            ->assertJsonPath('user.role', 'institutional')
            ->assertJsonPath('user.career_code', 'ISC');

        $this->getJson('/api/careers')
            ->assertOk()
            ->assertJsonPath('careers.ISC', 'Ingeniería en Sistemas Computacionales')
            ->assertJsonPath('careers.IIA', 'Ingeniería en Industrias Alimentarias')
            ->assertJsonPath('careers.ARQ', 'Arquitectura')
            ->assertJsonPath('careers.IADM', 'Ingeniería en Administración')
            ->assertJsonPath('careers.COPU', 'Contador Público');
    }
}
