<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ResidenceExpedient;
use App\Models\StudentDocument;
use App\Models\RepositoryEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Administrador Principal
        User::updateOrCreate(
            ['email' => 'juan.rodriguez@lahuerta.tecmm.edu.mx'],
            [
                'name' => 'Ing. Juan Carlos Rodríguez',
                'password' => Hash::make('Admin2026*'),
                'role' => 'admin',
                'career_code' => 'ISC',
            ]
        );

        // Minimal valid 1-page PDF
        $samplePdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF";

        // 2. Estudiante 1 (Con expediente y algunos documentos entregados / 1 rechazado para demostración)
        $student1 = User::updateOrCreate(
            ['email' => 'carlos.mendoza@lahuerta.tecmm.edu.mx'],
            [
                'name' => 'Carlos Mendoza Aguilar',
                'password' => Hash::make('Estudiante2026*'),
                'role' => 'institutional',
                'career_code' => 'ISC',
            ]
        );

        $expedient1 = ResidenceExpedient::firstOrCreate([
            'user_id' => $student1->id,
            'career_code' => 'ISC',
            'period' => 'Ago-Dic 2026',
        ]);

        $filePath1 = 'student-documents/'.$student1->id.'/'.$expedient1->id.'/carta-presentacion.pdf';
        Storage::disk('local')->put($filePath1, $samplePdfContent);

        StudentDocument::updateOrCreate(
            [
                'expedient_id' => $expedient1->id,
                'requirement_code' => 'presentation-letter',
            ],
            [
                'user_id' => $student1->id,
                'title' => '2 — Carta de presentación',
                'original_name' => 'Carta_Presentacion_Carlos_Mendoza.pdf',
                'path' => $filePath1,
                'mime_type' => 'application/pdf',
                'size' => strlen($samplePdfContent),
                'status' => 'Aprobado',
                'feedback' => null,
            ]
        );

        $filePath2 = 'student-documents/'.$student1->id.'/'.$expedient1->id.'/carta-aceptacion.pdf';
        Storage::disk('local')->put($filePath2, $samplePdfContent);

        StudentDocument::updateOrCreate(
            [
                'expedient_id' => $expedient1->id,
                'requirement_code' => 'acceptance-letter',
            ],
            [
                'user_id' => $student1->id,
                'title' => '3 — Carta de aceptación',
                'original_name' => 'Carta_Aceptacion_Firmada.pdf',
                'path' => $filePath2,
                'mime_type' => 'application/pdf',
                'size' => strlen($samplePdfContent),
                'status' => 'Rechazado',
                'feedback' => 'Falta el sello oficial de la empresa receptora en la parte inferior.',
            ]
        );

        // 3. Estudiante 2 (Expediente completo con Informe Técnico listo para publicar)
        $student2 = User::updateOrCreate(
            ['email' => 'mariana.morales@lahuerta.tecmm.edu.mx'],
            [
                'name' => 'Mariana Morales Velasco',
                'password' => Hash::make('Estudiante2026*'),
                'role' => 'institutional',
                'career_code' => 'IIND',
            ]
        );

        $expedient2 = ResidenceExpedient::firstOrCreate([
            'user_id' => $student2->id,
            'career_code' => 'IIND',
            'period' => 'Ago-Dic 2026',
        ]);

        $techReportPath = 'student-documents/'.$student2->id.'/'.$expedient2->id.'/informe-tecnico.pdf';
        Storage::disk('local')->put($techReportPath, $samplePdfContent);

        StudentDocument::updateOrCreate(
            [
                'expedient_id' => $expedient2->id,
                'requirement_code' => 'technical-report-pdf',
            ],
            [
                'user_id' => $student2->id,
                'title' => 'Informe técnico de residencia (PDF)',
                'original_name' => 'Informe_Final_Mariana_Morales.pdf',
                'path' => $techReportPath,
                'mime_type' => 'application/pdf',
                'size' => strlen($samplePdfContent),
                'status' => 'Aprobado',
                'feedback' => null,
            ]
        );

        // 4. Fichas Publicadas del Repositorio Institucional (Varias carreras del TecNM Campus La Huerta)
        $sampleResidences = [
            [
                'title' => 'Implementación de Arquitectura de Microservicios para el Control de Inventarios en Empresas Agroindustriales',
                'author' => 'Ing. David Alejandro Ramírez Soto',
                'career' => 'Ingeniería en Sistemas Computacionales',
                'institution' => 'TecNM Campus La Huerta / Agroindustrias del Pacífico',
                'year' => 2026,
                'description' => 'Desarrollo e implementación de una solución distribuida en la nube para el monitoreo de stock en tiempo real, trazabilidad de granos y sincronización con sistemas contables mediante API RESTful.',
            ],
            [
                'title' => 'Optimización de Tiempos de Ciclo en Líneas de Envasado mediante Metodología Lean Six Sigma',
                'author' => 'Ing. Mariana Morales Velasco',
                'career' => 'Ingeniería Industrial',
                'institution' => 'TecNM Campus La Huerta / Embotelladora de la Costa',
                'year' => 2026,
                'description' => 'Aplicación de herramientas de manufactura esbelta como 5S, mapeo de flujo de valor (VSM) y análisis de causa raíz para reducir los cuellos de botella en la planta de producción en un 22%.',
            ],
            [
                'title' => 'Diseño Bioclimático de Centro Comunitario y Ecoturístico Sustentable para la Región Costa Sur de Jalisco',
                'author' => 'Arq. Fernando José Cárdenas Gil',
                'career' => 'Arquitectura',
                'institution' => 'TecNM Campus La Huerta / H. Ayuntamiento de La Huerta',
                'year' => 2025,
                'description' => 'Propuesta arquitectónica sustentable con ventilación cruzada, materiales autóctonos, aprovechamiento de aguas pluviales y generación fotovoltaica integrada para el desarrollo rural.',
            ],
            [
                'title' => 'Desarrollo de Formulación de Bebida Funcional a base de Pitaya y Chía con Alto Contenido Antioxidante',
                'author' => 'Ing. Lucía Gómez Navarro',
                'career' => 'Ingeniería en Industrias Alimentarias',
                'institution' => 'TecNM Campus La Huerta / Laboratorio de Alimentos',
                'year' => 2025,
                'description' => 'Evaluación bromatológica, cinética de degradación de polifenoles y análisis sensorial de una bebida procesada a partir de frutos endémicos de la región costa de Jalisco.',
            ],
            [
                'title' => 'Evaluación Estructural y Propuesta de Reforzamiento de Pavimentos Asfálticos en Carreteras Estatales de Jalisco',
                'author' => 'Ing. Roberto Santana Peña',
                'career' => 'Ingeniería Civil',
                'institution' => 'TecNM Campus La Huerta / SIOP Jalisco',
                'year' => 2024,
                'description' => 'Estudio de mecánica de suelos, ensayos de deflexión con viga Benkelman y modelación matemática de fatiga para la rehabilitación de tramos carreteros vulnerables a inundaciones.',
            ],
            [
                'title' => 'Plan de Negocios y Estrategia de Mercadotecnia Digital para el Posicionamiento de Miel de Mangle en Mercados Gourmet',
                'author' => 'Lic. Claudia Patricia Ruiz Beltrán',
                'career' => 'Ingeniería en Administración',
                'institution' => 'TecNM Campus La Huerta / Cooperativa Apícola La Huerta',
                'year' => 2024,
                'description' => 'Investigación de mercados, estructuración de modelo Canvas, análisis financiero y diseño de campaña de comercio electrónico para productores apícolas de la costa.',
            ],
            [
                'title' => 'Implementación de un Sistema de Gestión de Calidad bajo la Norma ISO 9001:2015 en Empresa Frutícola',
                'author' => 'Ing. Edgar Iván Figueroa León',
                'career' => 'Ingeniería en Gestión Empresarial',
                'institution' => 'TecNM Campus La Huerta / Empacadora Frutas del Sur',
                'year' => 2025,
                'description' => 'Mapeo de macroprocesos, documentación de procedimientos estandarizados, auditorías internas y definición de indicadores clave de desempeño (KPI) para la certificación de calidad.',
            ],
            [
                'title' => 'Auditoría Fiscal y Cumplimiento de Obligaciones en Personas Morales del Sector Agrícola ante el SAT',
                'author' => 'C.P. Ana Karen Méndez Torres',
                'career' => 'Contador Público',
                'institution' => 'TecNM Campus La Huerta / Consultores Fiscales del Bajío',
                'year' => 2025,
                'description' => 'Análisis del régimen simplificado de confianza (RESICO) y régimen de actividades agrícolas, ganaderas, silvícolas y pesqueras (AGAPES), mitigando contingencias fiscales.',
            ],
        ];

        foreach ($sampleResidences as $residence) {
            $uuid = (string) Str::uuid();
            $fileName = 'Informe_Residencia_'.Str::slug($residence['author']).'.pdf';
            $pubPath = 'public-repository/'.$uuid.'.pdf';
            Storage::disk('local')->put($pubPath, $samplePdfContent);

            RepositoryEntry::updateOrCreate(
                ['title' => $residence['title']],
                [
                    'identifier' => $uuid,
                    'type' => 'Residencia',
                    'author' => $residence['author'],
                    'career' => $residence['career'],
                    'institution' => $residence['institution'],
                    'year' => $residence['year'],
                    'description' => $residence['description'],
                    'file_path' => $pubPath,
                    'file_name' => $fileName,
                    'file_size' => strlen($samplePdfContent),
                    'published' => true,
                ]
            );
        }
    }
}
