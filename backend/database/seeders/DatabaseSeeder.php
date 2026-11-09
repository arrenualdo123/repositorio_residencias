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

        // 2. Fichas Publicadas del Repositorio Institucional (Exclusivas de las 5 carreras oficiales de TSJ La Huerta)
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
                'title' => 'Desarrollo de Plataforma Web para la Automatización del Seguimiento de Residencias Profesionales',
                'author' => 'Ing. Miguel Ángel Ceballos Torres',
                'career' => 'Ingeniería en Sistemas Computacionales',
                'institution' => 'TecNM Campus La Huerta / Depto. de Sistemas e Informática',
                'year' => 2026,
                'description' => 'Diseño e implementación de un sistema web integral para la digitalización del expediente de residencia, auditoría de anexos y publicación en acceso abierto.',
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
                'title' => 'Estandarización del Proceso Térmico y Vida Útil en Pulpa de Mango Criollo Pasteurizada',
                'author' => 'Ing. Andrea Barajas Cuevas',
                'career' => 'Ingeniería en Industrias Alimentarias',
                'institution' => 'TecNM Campus La Huerta / Empacadora de Cítricos y Frutas',
                'year' => 2025,
                'description' => 'Determinación de parámetros cinéticos de penetración de calor (F0) y pruebas de estabilidad microbiológica para extender la conservación de pulpas tropicales sin conservadores artificiales.',
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
                'title' => 'Propuesta Urbano-Arquitectónica para la Regeneración del Espacio Público y Centro Histórico',
                'author' => 'Arq. Sofía Villaseñor Mora',
                'career' => 'Arquitectura',
                'institution' => 'TecNM Campus La Huerta / Dirección de Obras Públicas',
                'year' => 2024,
                'description' => 'Plan maestro de intervención urbana con criterios de accesibilidad universal, arbolado endémico y mobiliario urbano sustentable para fortalecer la identidad cultural regional.',
            ],
            [
                'title' => 'Plan de Negocios y Estrategia de Mercadotecnia Digital para el Posicionamiento de Miel de Mangle en Mercados Gourmet',
                'author' => 'Lic. Claudia Patricia Ruiz Beltrán',
                'career' => 'Licenciatura en Administración',
                'institution' => 'TecNM Campus La Huerta / Cooperativa Apícola La Huerta',
                'year' => 2024,
                'description' => 'Investigación de mercados, estructuración de modelo Canvas, análisis financiero y diseño de campaña de comercio electrónico para productores apícolas de la costa.',
            ],
            [
                'title' => 'Auditoría Fiscal y Cumplimiento de Obligaciones en Personas Morales del Sector Agrícola ante el SAT',
                'author' => 'C.P. Ana Karen Méndez Torres',
                'career' => 'Licenciatura en Contador Público',
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
