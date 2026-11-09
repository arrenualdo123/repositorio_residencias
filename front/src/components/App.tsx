import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Database,
  Eye,
  FileCheck2,
  FileX,
  Lock,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowLeft,
  Search,
  ChevronRight,
  BookOpen,
  Download,
  Copy,
  Check,
  Trash2,
  Globe,
  X,
  BookCheck,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

type SearchResult = {
  id: number;
  identifier: string;
  title: string;
  type: string;
  author?: string;
  career?: string;
  institution?: string;
  year?: number;
  meta: string;
  description?: string;
  has_file?: boolean;
  file_name?: string | null;
  file_url?: string | null;
};

type SearchResponse = {
  data: SearchResult[];
  total: number;
  current_page: number;
  last_page: number;
};

type StudentDocument = {
  id: number;
  identifier?: string;
  title: string;
  detail: string;
  status: string;
  feedback?: string | null;
  file_url?: string;
};

type RequirementFile = {
  id: number;
  identifier: string;
  detail?: string;
  status: string;
  feedback?: string | null;
  file_url: string;
  original_name?: string;
  uploaded_at?: string;
};

type ResidenceRequirement = {
  code: string;
  title: string;
  extensions: string[];
  document: RequirementFile | null;
};

type ResidenceExpedient = {
  id: number;
  career_code: string;
  career: string;
  period: string;
  completed: number;
  total: number;
  requirements: ResidenceRequirement[];
};

type AdminExpedient = {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  career_code: string;
  career_name: string;
  period: string;
  completed: number;
  approved: number;
  total: number;
  requirements: ResidenceRequirement[];
};

type AdminCatalogEntry = {
  id: number;
  identifier: string;
  title: string;
  type: string;
  author: string;
  career: string;
  institution: string;
  year: number;
  description: string;
  published: boolean;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
};

type AdminSummary = {
  active_students: number;
  uploaded_documents: number;
  documents_under_review: number;
};

type AdminDocument = {
  id: number;
  identifier: string;
  title: string;
  student_name: string;
  email: string;
  status: string;
  file_url: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let msg = 'No fue posible obtener la información';
    try {
      const errData = await response.json();
      if (errData.message) msg = errData.message;
    } catch {
      // fallback
    }
    throw new Error(msg);
  }

  return response.json();
}

async function downloadPrivateFile(url: string, filename: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('No fue posible descargar el archivo.');
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function Header({
  isAuthenticated,
  onNavigateToCatalog,
  onOpenLogin,
  onLogout,
}: {
  isAuthenticated: boolean;
  onNavigateToCatalog: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="bg-[var(--brand-red-100)] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <button
          type="button"
          onClick={() => onNavigateToCatalog()}
          className="flex items-center gap-2 text-lg font-bold"
        >
          <Database className="h-5 w-5 text-white" />
          <span>Repositorio</span>
          <span className="font-normal opacity-90">Institucional TSJ La Huerta</span>
        </button>

        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <button type="button" onClick={() => onNavigateToCatalog()} className="hover:underline">
            Buscar
          </button>
          <button type="button" onClick={() => onNavigateToCatalog()} className="hover:underline">
            Residencias
          </button>
        </nav>

        <button
          onClick={isAuthenticated ? onLogout : onOpenLogin}
          className="rounded bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-red-100)] shadow-sm hover:bg-red-50"
        >
          {isAuthenticated ? 'Cerrar Sesión' : 'Identificarse'}
        </button>
      </div>
    </header>
  );
}

// Modal de Metadatos Dublin Core y Cita APA
function DublinCoreModal({
  result,
  onClose,
}: {
  result: SearchResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const apaCitation = `${result.author || 'Autor no especificado'} (${result.year || 's.f.'}). ${result.title} [Informe de Residencia Profesional, TecNM Campus La Huerta]. Repositorio Institucional Digital.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apaCitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dublinCoreFields = [
    { label: 'dc:title (Título)', value: result.title },
    { label: 'dc:creator (Autor)', value: result.author || 'No especificado' },
    { label: 'dc:date (Fecha)', value: result.year ? String(result.year) : 's.f.' },
    { label: 'dc:type (Tipo de recurso)', value: 'info:eu-repo/semantics/bachelorThesis / Residencia Profesional' },
    { label: 'dc:format (Formato)', value: 'application/pdf' },
    { label: 'dc:identifier (Identificador / Folio)', value: result.identifier },
    { label: 'dc:publisher (Institución editora)', value: 'Tecnológico Nacional de México / Instituto Tecnológico Superior de Jalisco, Unidad Académica La Huerta' },
    { label: 'dc:subject (Materia / Carrera)', value: result.career || 'Residencia Profesional' },
    { label: 'dc:description (Resumen)', value: result.description || 'Sin resumen disponible.' },
    { label: 'dc:rights (Derechos / Acceso)', value: 'Acceso Abierto (Open Access) - Licencia Creative Commons Atribución-NoComercial 4.0 Internacional' },
    { label: 'dc:language (Idioma)', value: 'spa (Español)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <BookCheck className="h-5 w-5 text-[var(--brand-red-100)]" />
            <h2 className="text-base font-bold text-slate-900">Metadatos Bibliográficos & Cita Académica</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6 text-sm">
          {/* Cita APA 7 */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-900">
                Cita en Formato APA (7ª Edición)
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1 rounded bg-[var(--brand-red-100)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar Cita'}
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-800 italic select-all">
              {apaCitation}
            </p>
          </div>

          {/* Tabla Dublin Core */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              Esquema de Metadatos Estándar Dublin Core (ISO 15836)
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2 w-1/3">Elemento Dublin Core</th>
                    <th className="px-3 py-2 w-2/3">Valor / Metadato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dublinCoreFields.map((field) => (
                    <tr key={field.label} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-medium text-slate-700">{field.label}</td>
                      <td className="px-3 py-2 text-slate-900">{field.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicView({
  onOpenLogin,
  isAuthenticated,
}: {
  onOpenLogin: () => void;
  isAuthenticated: boolean;
}) {
  const [query, setQuery] = useState('');
  const [career, setCareer] = useState('');
  const [careerOptions, setCareerOptions] = useState<Record<string, string>>({});
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [summaryFilter, setSummaryFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<SearchResult | null>(null);

  async function searchRepository(page = 1, event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (career) params.set('career', career);
    if (yearFrom) params.set('year_from', yearFrom);
    if (yearTo) params.set('year_to', yearTo);
    if (titleFilter.trim()) params.set('title', titleFilter.trim());
    if (summaryFilter.trim()) params.set('summary', summaryFilter.trim());
    if (page > 1) params.set('page', String(page));

    try {
      const data = await request<SearchResponse>(`/repository/search?${params}`);

      setResults(data.data);
      setTotal(data.total);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
    } catch {
      setError('No se pudieron cargar los resultados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void searchRepository();
    void request<{ careers: Record<string, string> }>('/careers')
      .then((data) => setCareerOptions(data.careers))
      .catch(() => setCareerOptions({}));
  }, []);

  return (
    <main className="mx-auto grid w-full max-w-[1280px] justify-center gap-8 px-6 py-8 md:grid-cols-[240px_minmax(0,720px)_240px]">
      <aside className="space-y-6 text-sm">
        <h2 className="flex items-center gap-2 border-b border-[var(--palette-f-60)] pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--palette-a-80)]">
          <Filter className="h-4 w-4" /> Filtros del Catálogo
        </h2>

        <div className="rounded border border-[var(--palette-f-60)] bg-white px-3 py-2 text-sm shadow-xs">
          Tipo de documento<br /><strong>Residencias Profesionales</strong>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Carrera</h3>
          <select value={career} onChange={(event) => setCareer(event.target.value)} className="w-full rounded border border-[var(--palette-f-60)] bg-white px-2 py-2 text-xs">
            <option value="">Todas las carreras</option>
            {Object.entries(careerOptions).map(([code, name]) => (
              <option key={code} value={name}>{code} — {name}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Rango de años</h3>
          <label className="mb-2 block text-xs text-[var(--palette-a-80)]">
            Desde
            <input type="number" min="1900" max="2100" value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} className="mt-1 w-full rounded border border-[var(--palette-f-60)] px-2 py-1.5 text-sm text-[var(--palette-a)]" />
          </label>
          <label className="block text-xs text-[var(--palette-a-80)]">
            Hasta
            <input type="number" min="1900" max="2100" value={yearTo} onChange={(event) => setYearTo(event.target.value)} className="mt-1 w-full rounded border border-[var(--palette-f-60)] px-2 py-1.5 text-sm text-[var(--palette-a)]" />
          </label>
          <button type="button" onClick={() => void searchRepository(1)} className="mt-3 w-full rounded bg-[var(--brand-red-100)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)]">
            Aplicar filtros
          </button>
        </div>
      </aside>

      <section className="min-w-0">
        <h1 className="mb-3 text-2xl font-bold tracking-tight">
          Buscar en el Repositorio Institucional
        </h1>
        <p className="mb-4 text-xs text-slate-500">
          Consulta y descarga en acceso abierto los informes técnicos de residencia aprobados del TecNM Campus La Huerta.
        </p>

        <form onSubmit={(e) => searchRepository(1, e)} className="mb-5 flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Título, autor o palabra clave..."
            className="flex-1 rounded-lg border border-[var(--palette-f-60)] bg-white px-3.5 py-2 text-sm shadow-xs"
          />

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-red-100)] px-5 font-semibold text-white shadow-xs hover:bg-[var(--brand-red-80)]"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
        </form>

        <details className="mb-5 rounded-lg border border-[var(--palette-f-60)] bg-white px-4 py-3 shadow-xs">
          <summary className="cursor-pointer text-xs font-semibold text-slate-700">Búsqueda avanzada por título y resumen</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--palette-a-80)]">
              Palabras en el título
              <input value={titleFilter} onChange={(event) => setTitleFilter(event.target.value)} className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-1.5 text-xs text-[var(--palette-a)]" placeholder="Ej. Inventarios, Envasado..." />
            </label>
            <label className="text-xs font-medium text-[var(--palette-a-80)]">
              Palabras en el resumen
              <input value={summaryFilter} onChange={(event) => setSummaryFilter(event.target.value)} className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-1.5 text-xs text-[var(--palette-a)]" placeholder="Ej. Microservicios, Lean Six Sigma..." />
            </label>
            <button type="button" onClick={() => void searchRepository(1)} className="rounded bg-[var(--brand-red-100)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)] sm:col-span-2">
              Filtrar resultados
            </button>
          </div>
        </details>

        <p id="repository-count" className="mb-3 text-xs font-medium text-[var(--palette-a-80)]">
          {loading ? 'Buscando...' : `${total} publicaciones encontradas`}
        </p>

        {loading && (
          <p className="py-6 text-center text-sm text-[var(--palette-a-80)]">
            Cargando acervo bibliográfico...
          </p>
        )}

        {error && <p className="text-sm text-[var(--palette-d)]">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No se encontraron publicaciones con los criterios ingresados.
          </div>
        )}

        <div className="divide-y divide-[var(--palette-f-60)] border-t border-[var(--palette-f-60)]">
          {results.map((result) => (
            <article key={result.id} className="py-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-base font-bold text-[var(--brand-red-100)]">
                  {result.title}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {result.type}
                </span>
                {result.career && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-[var(--brand-red-100)]">
                    {result.career}
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] font-mono text-[var(--palette-a-80)]">
                Folio / URI: {result.identifier}
              </p>

              <p className="mt-1 text-xs text-slate-600 font-medium">
                {result.meta}
              </p>

              {result.description && (
                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  {result.description}
                </p>
              )}

              {/* Botones de Acción: Descarga y Cita */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {result.has_file && result.file_url ? (
                  <>
                    <a
                      href={result.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-red-100)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--brand-red-80)]"
                    >
                      <Download className="h-3.5 w-3.5" /> Descargar PDF
                    </a>
                    <a
                      href={`${result.file_url}?preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver en línea
                    </a>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                    <Lock className="h-3 w-3" /> Ficha sin documento adjunto
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCitation(result)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--palette-f-60)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <BookCheck className="h-3.5 w-3.5 text-[var(--brand-red-100)]" /> Ficha Dublin Core / Citar
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Paginación */}
        {lastPage > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-[var(--palette-f-60)] pt-4 text-xs">
            <span className="text-slate-600">
              Página <strong>{currentPage}</strong> de <strong>{lastPage}</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => searchRepository(currentPage - 1)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => searchRepository(currentPage + 1)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="h-fit w-full rounded-lg border border-[var(--palette-f-60)] bg-white p-5 text-center shadow-xs">
        {isAuthenticated ? (
          <>
            <h2 className="mb-2 font-semibold">Acceso Institucional</h2>
            <p className="text-xs text-[var(--palette-a-80)]">
              Sesión iniciada. Tienes acceso autorizado a tu expediente o panel administrativo según tu rol.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-3 font-semibold">Acceso Alumnos & Docentes</h2>
            <p className="mb-4 text-xs text-[var(--palette-a-80)]">
              Para tramitar tu expediente o revisar requisitos de residencia con correo institucional:
            </p>
            <button
              onClick={onOpenLogin}
              className="w-full rounded-lg bg-[var(--brand-red-100)] py-2 font-semibold text-white shadow-xs hover:bg-[var(--brand-red-80)]"
            >
              Identificarse
            </button>
          </>
        )}
      </aside>

      {/* Modal de Metadatos Dublin Core */}
      {selectedCitation && (
        <DublinCoreModal
          result={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </main>
  );
}

function StudentView() {
  const [expedients, setExpedients] = useState<ResidenceExpedient[]>([]);
  const [legacyDocuments, setLegacyDocuments] = useState<StudentDocument[]>([]);
  const [careers, setCareers] = useState<Record<string, string>>({});
  const [profileCareerCode, setProfileCareerCode] = useState('');
  const [periods, setPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodName, setPeriodName] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selectedExpedientId, setSelectedExpedientId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function refreshExpedients() {
    try {
      const data = await request<{
        expedients: ResidenceExpedient[];
        legacy_documents: StudentDocument[];
        career_code: string | null;
        careers: Record<string, string>;
        periods: string[];
      }>('/student/expedients');

      setExpedients(data.expedients);
      setLegacyDocuments(data.legacy_documents);
      setProfileCareerCode(data.career_code ?? '');
      setCareers(data.careers);
      setPeriods(data.periods);
      setPeriodName((current) => current || data.periods[new Date().getMonth() >= 7 ? 1 : 0] || data.periods[0] || '');
      setSelectedExpedientId((current) =>
        data.expedients.some((expedient) => expedient.id === current)
          ? current
          : data.expedients[0]?.id ?? null,
      );
      setError('');
    } catch {
      setError('No se pudo cargar tu expediente. Inicia sesión nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshExpedients();
  }, []);

  if (loading) {
    return <p className="p-8">Cargando expediente...</p>;
  }

  async function createExpedient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError('');

    try {
      const data = await request<{ expedient: ResidenceExpedient }>('/student/expedients', {
        method: 'POST',
        body: JSON.stringify({ period_name: periodName, year: Number(year) }),
      });
      setSelectedExpedientId(data.expedient.id);
      await refreshExpedients();
    } catch {
      setError('No se pudo crear el expediente. Revisa carrera y periodo.');
    } finally {
      setCreating(false);
    }
  }

  async function saveProfileCareer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError('');

    try {
      await request('/student/career', {
        method: 'POST',
        body: JSON.stringify({ career_code: profileCareerCode }),
      });
      await refreshExpedients();
    } catch {
      setError('No se pudo guardar tu carrera. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  }

  const selectedExpedient = expedients.find((expedient) => expedient.id === selectedExpedientId);
  const progress = selectedExpedient
    ? Math.round((selectedExpedient.completed / selectedExpedient.total) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-[980px] px-6 py-8">
      <div className="mb-6 flex justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Mi expediente de residencia</h1>
          <p className="text-sm text-[var(--palette-a-80)]">Tus archivos solo son visibles para ti y el personal autorizado.</p>
        </div>

        <div className="flex h-fit items-center gap-2 rounded-full border border-[var(--brand-red-40)] bg-[var(--brand-red-20)] px-3 py-2 text-xs font-semibold text-[var(--brand-red-100)]">
          <Lock className="h-4 w-4" />
          Privado
        </div>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-[var(--palette-d)]">{error}</p>}

      {!profileCareerCode && !loading && (
        <form onSubmit={saveProfileCareer} className="mb-6 grid gap-4 rounded-lg border border-[var(--palette-f-60)] bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold">Completa tu perfil académico</h2>
          <p className="text-sm text-[var(--palette-a-80)]">Registra tu carrera una sola vez. Tus expedientes nuevos la tomarán automáticamente.</p>
          <label className="text-sm font-medium">
            Carrera
            <select required value={profileCareerCode} onChange={(event) => setProfileCareerCode(event.target.value)} className="mt-1 block w-full rounded border border-[var(--palette-f-60)] bg-white px-3 py-2 font-normal">
              <option value="">Selecciona tu carrera</option>
              {Object.entries(careers).map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
            </select>
          </label>
          <button disabled={creating || !careers[profileCareerCode]} className="w-fit rounded bg-[var(--brand-red-100)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-red-80)] disabled:opacity-60">
            {creating ? 'Guardando...' : 'Guardar carrera'}
          </button>
        </form>
      )}

      {profileCareerCode && !selectedExpedient && !loading && (
        <form onSubmit={createExpedient} className="mb-6 grid gap-4 rounded-lg border border-[var(--palette-f-60)] bg-white p-5 shadow-xs sm:grid-cols-2">
          <h2 className="text-base font-semibold sm:col-span-2">Crear expediente · {profileCareerCode} — {careers[profileCareerCode]}</h2>
          <label className="text-sm font-medium">
            Periodo
            <div className="mt-1 flex gap-2">
              <select required value={periodName} onChange={(event) => setPeriodName(event.target.value)} className="min-w-0 flex-1 rounded border border-[var(--palette-f-60)] bg-white px-3 py-2 font-normal">
                {periods.map((period) => <option key={period} value={period}>{period}</option>)}
              </select>
              <input aria-label="Año del periodo" required type="number" min="2020" max={new Date().getFullYear() + 1} value={year} onChange={(event) => setYear(event.target.value)} className="w-24 rounded border border-[var(--palette-f-60)] px-3 py-2 font-normal" />
            </div>
          </label>
          <button disabled={creating || !periodName} className="rounded bg-[var(--brand-red-100)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-red-80)] disabled:opacity-60 sm:col-span-2">
            {creating ? 'Creando expediente...' : 'Crear expediente'}
          </button>
        </form>
      )}

      {selectedExpedient && (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold">{selectedExpedient.career_code} · {selectedExpedient.period}</h2>
              <p className="text-sm text-[var(--palette-a-80)]">{selectedExpedient.career}</p>
            </div>
            {expedients.length > 1 && (
              <label className="text-xs text-[var(--palette-a-80)]">
                Cambiar expediente
                <select value={selectedExpedient.id} onChange={(event) => setSelectedExpedientId(Number(event.target.value))} className="ml-2 rounded border border-[var(--palette-f-60)] bg-white px-2 py-1.5 text-sm text-[var(--palette-a)]">
                  {expedients.map((expedient) => <option key={expedient.id} value={expedient.id}>{expedient.career_code} · {expedient.period}</option>)}
                </select>
              </label>
            )}
          </div>

          <div className="mb-2 flex justify-between text-xs text-[var(--palette-a-80)]">
            <span>Progreso del expediente</span>
            <span>{selectedExpedient.completed} de {selectedExpedient.total} documentos</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-[var(--palette-f-60)]">
            <div className="h-full bg-[var(--brand-red-100)] transition-[width]" style={{ width: `${progress}%` }} />
          </div>

          <div className="divide-y divide-[var(--palette-f-60)] overflow-hidden rounded-lg border border-[var(--palette-f-60)] bg-white shadow-xs">
            {selectedExpedient.requirements.map((requirement) => (
              <RequirementRow
                key={requirement.code}
                expedientId={selectedExpedient.id}
                requirement={requirement}
                onUploaded={refreshExpedients}
              />
            ))}
          </div>
        </>
      )}

      {legacyDocuments.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">Archivos subidos anteriormente</h2>
          <div className="divide-y divide-[var(--palette-f-60)] overflow-hidden rounded-lg border border-[var(--palette-f-60)] bg-white shadow-xs">
            {legacyDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-[var(--palette-a-80)]">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Tus archivos se resguardan de forma privada y protegida en el servidor institucional.
      </div>
    </main>
  );
}

function RequirementRow({
  expedientId,
  requirement,
  onUploaded,
}: {
  expedientId: number;
  requirement: ResidenceRequirement;
  onUploaded: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Selecciona un archivo primero.');
      return;
    }

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('requirement_code', requirement.code);
    formData.append('file', file);

    try {
      await request(`/student/expedients/${expedientId}/documents`, {
        method: 'POST',
        body: formData,
      });
      setFile(null);
      await onUploaded();
    } catch {
      setError(`No se pudo subir. Formato permitido: ${requirement.extensions.join(', ').toUpperCase()}; máximo 10 MB.`);
    } finally {
      setUploading(false);
    }
  }

  const isApproved = requirement.document?.status === 'Aprobado';
  const isRejected = requirement.document?.status === 'Rechazado';

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {isApproved ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : isRejected ? (
          <XCircle className="h-5 w-5 shrink-0 text-red-600" />
        ) : requirement.document ? (
          <FileCheck2 className="h-5 w-5 shrink-0 text-[var(--palette-c)]" />
        ) : (
          <FileX className="h-5 w-5 shrink-0 text-[var(--palette-a-80)]" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">{requirement.title}</h3>
          <p className="text-[11px] text-[var(--palette-a-80)]">
            Clave: {requirement.code}
            {requirement.document ? ` · Folio: ${requirement.document.identifier}` : ''}
          </p>
          <p className="text-xs text-[var(--palette-a-80)]">
            {requirement.document?.detail ?? `Pendiente de subir · ${requirement.extensions.join(' / ').toUpperCase()}`}
          </p>
          {error && <p role="alert" className="mt-1 text-xs text-[var(--palette-d)]">{error}</p>}
        </div>

        {requirement.document && (
          <div className="flex items-center gap-2">
            {isApproved && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Aprobado
              </span>
            )}
            {isRejected && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                Rechazado
              </span>
            )}
            {!isApproved && !isRejected && (
              <span className="rounded-full bg-[var(--palette-c-20)] px-2 py-1 text-xs font-semibold text-[var(--palette-a)]">
                {requirement.document.status || 'Recibido'}
              </span>
            )}

            <button
              type="button"
              onClick={() => void downloadPrivateFile(requirement.document!.file_url, `${requirement.title}.${requirement.extensions[0]}`)}
              className="flex items-center gap-1 rounded border border-[var(--palette-f-60)] bg-white px-2 py-1 text-xs hover:bg-[var(--palette-f-20)]"
            >
              <Eye className="h-4 w-4" /> Ver
            </button>
          </div>
        )}

        {!requirement.document && (
          <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              required
              accept={requirement.extensions.map((ext) => `.${ext}`).join(',')}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="max-w-48 text-xs"
            />
            <button
              disabled={uploading}
              className="flex items-center gap-1 rounded bg-[var(--brand-red-100)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)] disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" /> {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </form>
        )}
      </div>

      {isRejected && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Observaciones del Revisor / Administrador:</p>
              <p className="mt-0.5 text-red-950 font-normal">{requirement.document?.feedback || 'Documento no aprobado. Por favor corrige y vuelve a subir.'}</p>
            </div>
          </div>
          <form onSubmit={upload} className="mt-3 flex flex-wrap items-center gap-2 border-t border-red-200 pt-2">
            <span className="font-medium text-red-950">Subir corrección:</span>
            <input
              type="file"
              required
              accept={requirement.extensions.map((ext) => `.${ext}`).join(',')}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="max-w-48 rounded border border-red-300 bg-white px-1.5 py-1 text-xs"
            />
            <button
              disabled={uploading}
              className="flex items-center gap-1 rounded bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" /> {uploading ? 'Subiendo...' : 'Reemplazar documento'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function DocumentRow({
  document,
}: {
  document: StudentDocument;
}) {
  const [downloadError, setDownloadError] = useState('');
  const received = document.status === 'Recibido';
  const pending = document.status === 'Pendiente';

  async function handleDownload() {
    if (!document.file_url) return;

    try {
      await downloadPrivateFile(document.file_url, `${document.title}.pdf`);
      setDownloadError('');
    } catch {
      setDownloadError('No se pudo descargar. Verifica tu sesión.');
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
      {received ? (
        <FileCheck2 className="h-5 w-5 text-[var(--palette-c)]" />
      ) : pending ? (
        <FileX className="h-5 w-5 text-[var(--palette-a-80)]" />
      ) : (
        <Clock className="h-5 w-5 text-[var(--palette-e)]" />
      )}

      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-medium">{document.title}</h2>
        <p className="text-xs text-[var(--palette-a-80)]">{document.detail}{document.identifier ? ` · Folio ${document.identifier.slice(0, 8)}` : ''}</p>
      </div>

      <span className="rounded-full bg-[var(--palette-c-20)] px-2 py-1 text-xs font-semibold text-[var(--palette-a)]">
        {document.status}
      </span>

      {received && document.file_url && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 rounded border border-[var(--palette-f-60)] px-2 py-1 text-xs"
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
      )}

      {pending && (
        <button className="flex items-center gap-1 rounded bg-[var(--brand-red-100)] px-3 py-2 text-xs text-white hover:bg-[var(--brand-red-80)]">
          <Upload className="h-4 w-4" />
          Subir
        </button>
      )}

      {downloadError && <span className="text-xs text-[var(--palette-d)]">{downloadError}</span>}
    </div>
  );
}

function AdminView() {
  const [activeTab, setActiveTab] = useState<'expedients' | 'catalog' | 'manual' | 'recent'>('expedients');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<AdminDocument[]>([]);
  const [error, setError] = useState('');

  // Expedientes State
  const [expedients, setExpedients] = useState<AdminExpedient[]>([]);
  const [careers, setCareers] = useState<Record<string, string>>({});
  const [periods, setPeriods] = useState<string[]>([]);
  const [filterCareer, setFilterCareer] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [searchStudent, setSearchStudent] = useState('');
  const [loadingExpedients, setLoadingExpedients] = useState(false);
  const [selectedExpedient, setSelectedExpedient] = useState<AdminExpedient | null>(null);

  // Catálogo Publicado State (Admin)
  const [catalogEntries, setCatalogEntries] = useState<AdminCatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogMessage, setCatalogMessage] = useState('');

  // Reviewing single document state
  const [reviewingDocId, setReviewingDocId] = useState<number | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [reviewAlert, setReviewAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Direct Publish State
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishFormTitle, setPublishFormTitle] = useState('');
  const [publishFormDesc, setPublishFormDesc] = useState('');

  // Manual Publish Form State
  const [manualPublishing, setManualPublishing] = useState(false);
  const [manualPublishMessage, setManualPublishMessage] = useState('');

  async function loadSummaryAndRecent() {
    try {
      const data = await request<{
        summary: AdminSummary;
        documents: AdminDocument[];
      }>('/admin/documents');
      setSummary(data.summary);
      setRecentDocuments(data.documents);
    } catch {
      setError('No se pudieron cargar los datos administrativos.');
    }
  }

  async function fetchExpedients() {
    setLoadingExpedients(true);
    const params = new URLSearchParams();
    if (filterCareer) params.set('career_code', filterCareer);
    if (filterPeriod) params.set('period_name', filterPeriod);
    if (filterYear) params.set('year', filterYear);
    if (searchStudent.trim()) params.set('search', searchStudent.trim());

    try {
      const data = await request<{
        expedients: AdminExpedient[];
        careers: Record<string, string>;
        periods: string[];
      }>(`/admin/expedients?${params.toString()}`);

      setExpedients(data.expedients);
      setCareers(data.careers);
      setPeriods(data.periods);

      if (selectedExpedient) {
        const refreshed = data.expedients.find((e) => e.id === selectedExpedient.id);
        if (refreshed) setSelectedExpedient(refreshed);
      }
    } catch {
      setError('No fue posible cargar la lista de expedientes.');
    } finally {
      setLoadingExpedients(false);
    }
  }

  async function fetchCatalogEntries() {
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams();
      if (catalogSearch.trim()) params.set('search', catalogSearch.trim());
      const data = await request<{ entries: AdminCatalogEntry[] }>(`/admin/repository/entries?${params}`);
      setCatalogEntries(data.entries);
    } catch {
      setCatalogMessage('No se pudieron cargar las fichas del catálogo.');
    } finally {
      setCatalogLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    if (!window.confirm('¿Seguro que deseas eliminar esta ficha del catálogo público? El archivo también se borrará.')) {
      return;
    }
    try {
      await request(`/admin/repository/entries/${id}`, { method: 'DELETE' });
      setCatalogMessage('Ficha eliminada del catálogo exitosamente.');
      await fetchCatalogEntries();
      await loadSummaryAndRecent();
    } catch {
      setCatalogMessage('No fue posible eliminar la publicación.');
    }
  }

  async function handleTogglePublish(id: number) {
    try {
      await request(`/admin/repository/entries/${id}/toggle`, { method: 'PATCH' });
      await fetchCatalogEntries();
    } catch {
      setCatalogMessage('Error al cambiar visibilidad.');
    }
  }

  useEffect(() => {
    void loadSummaryAndRecent();
    void fetchExpedients();
    void fetchCatalogEntries();
  }, []);

  async function handleReview(docId: number, status: 'Aprobado' | 'Rechazado' | 'En revisión', feedback?: string) {
    setReviewingDocId(docId);
    setReviewAlert(null);
    try {
      await request(`/admin/documents/${docId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          feedback: feedback || null,
        }),
      });
      setRejectingDocId(null);
      setFeedbackInput('');
      setReviewAlert({ type: 'success', message: `Documento marcado como "${status}" correctamente.` });
      await fetchExpedients();
      await loadSummaryAndRecent();
    } catch (err: any) {
      setReviewAlert({ type: 'error', message: err.message || 'Error al calificar el documento.' });
    } finally {
      setReviewingDocId(null);
    }
  }

  async function handlePublishApprovedReport(e: FormEvent) {
    e.preventDefault();
    if (!selectedExpedient) return;
    setPublishing(true);
    setPublishMessage('');

    try {
      const res = await request<{ message: string }>(
        `/admin/expedients/${selectedExpedient.id}/publish-report`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: publishFormTitle,
            description: publishFormDesc,
            year: Number(filterYear) || new Date().getFullYear(),
          }),
        }
      );
      setPublishMessage(res.message || 'Ficha publicada exitosamente en el catálogo público.');
      setPublishFormTitle('');
      setPublishFormDesc('');
      await loadSummaryAndRecent();
      await fetchCatalogEntries();
    } catch (err: any) {
      setPublishMessage(err.message || 'Error al publicar la ficha.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleManualPublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualPublishing(true);
    setManualPublishMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await request('/admin/repository/entries', {
        method: 'POST',
        body: form,
      });
      formElement.reset();
      setManualPublishMessage('Ficha publicada con éxito; ya aparece en el buscador público.');
      await fetchCatalogEntries();
      await loadSummaryAndRecent();
    } catch {
      setManualPublishMessage('No se pudo publicar. Revisa los campos e intenta otra vez.');
    } finally {
      setManualPublishing(false);
    }
  }

  useEffect(() => {
    if (selectedExpedient) {
      const report = selectedExpedient.requirements.find(
        (r) =>
          (r.code === 'technical-report-pdf' || r.code === 'technical-report-docx') &&
          r.document?.status === 'Aprobado'
      );
      if (report?.document) {
        setPublishFormTitle(`Informe de Residencia - ${selectedExpedient.student_name}`);
      }
    }
  }, [selectedExpedient]);

  const approvedReport = selectedExpedient?.requirements.find(
    (r) =>
      (r.code === 'technical-report-pdf' || r.code === 'technical-report-docx') &&
      r.document?.status === 'Aprobado'
  );

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administración de Residencias</h1>
          <p className="text-sm text-[var(--palette-a-80)]">
            Supervisión académica de expedientes, auditoría de requisitos y preservación en catálogo público.
          </p>
        </div>
      </div>

      {summary && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Summary label="Alumnos con expediente" value={summary.active_students} />
          <Summary label="Documentos resguardados" value={summary.uploaded_documents} />
          <Summary label="Documentos pendientes de revisión" value={summary.documents_under_review} />
        </div>
      )}

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-[var(--palette-d)]">{error}</p>}

      {/* Navegación por pestañas */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-[var(--palette-f-60)]">
        <button
          type="button"
          onClick={() => { setActiveTab('expedients'); setSelectedExpedient(null); }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'expedients'
              ? 'border-[var(--brand-red-100)] text-[var(--brand-red-100)]'
              : 'border-transparent text-[var(--palette-a-80)] hover:text-[var(--palette-a)]'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Expedientes por Periodo
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('catalog'); void fetchCatalogEntries(); }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'catalog'
              ? 'border-[var(--brand-red-100)] text-[var(--brand-red-100)]'
              : 'border-transparent text-[var(--palette-a-80)] hover:text-[var(--palette-a)]'
          }`}
        >
          <Globe className="h-4 w-4" />
          Catálogo Publicado ({catalogEntries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'manual'
              ? 'border-[var(--brand-red-100)] text-[var(--brand-red-100)]'
              : 'border-transparent text-[var(--palette-a-80)] hover:text-[var(--palette-a)]'
          }`}
        >
          <Upload className="h-4 w-4" />
          Publicación Manual
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'recent'
              ? 'border-[var(--brand-red-100)] text-[var(--brand-red-100)]'
              : 'border-transparent text-[var(--palette-a-80)] hover:text-[var(--palette-a)]'
          }`}
        >
          <Clock className="h-4 w-4" />
          Auditoría de Documentos
        </button>
      </div>

      {/* PESTAÑA 1: EXPEDIENTES POR PERIODO */}
      {activeTab === 'expedients' && (
        <div className="mt-6">
          {selectedExpedient ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => { setSelectedExpedient(null); setReviewAlert(null); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--palette-f-60)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--palette-a)] hover:bg-[var(--palette-f-20)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a la lista de expedientes
              </button>

              <div className="rounded-lg border border-[var(--palette-f-60)] bg-white p-6 shadow-xs">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <span className="inline-block rounded bg-[var(--brand-red-20)] px-2.5 py-0.5 text-xs font-bold uppercase text-[var(--brand-red-100)]">
                      {selectedExpedient.career_code} · {selectedExpedient.period}
                    </span>
                    <h2 className="mt-2 text-xl font-bold">{selectedExpedient.student_name}</h2>
                    <p className="text-sm text-[var(--palette-a-80)]">{selectedExpedient.student_email}</p>
                    <p className="text-xs text-[var(--palette-a-80)]">{selectedExpedient.career_name}</p>
                  </div>

                  <div className="text-right sm:w-64">
                    <div className="text-xs font-medium text-[var(--palette-a-80)]">
                      Progreso: {selectedExpedient.completed} de {selectedExpedient.total} entregados
                    </div>
                    <div className="text-xs font-semibold text-emerald-700">
                      {selectedExpedient.approved} requisitos aprobados
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--palette-f-60)]">
                      <div
                        className="h-full bg-[var(--brand-red-100)] transition-all"
                        style={{ width: `${Math.round((selectedExpedient.completed / selectedExpedient.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {reviewAlert && (
                <div
                  className={`rounded-lg p-3 text-xs font-medium ${
                    reviewAlert.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {reviewAlert.message}
                </div>
              )}

              {/* CHECKLIST DE REVISIÓN */}
              <div className="overflow-hidden rounded-lg border border-[var(--palette-f-60)] bg-white shadow-xs">
                <div className="border-b border-[var(--palette-f-60)] bg-[var(--palette-f-20)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--palette-a-80)]">
                  Checklist de Documentos del Alumno (Modo Auditoría / Calificación)
                </div>

                <div className="divide-y divide-[var(--palette-f-60)]">
                  {selectedExpedient.requirements.map((req) => {
                    const doc = req.document;
                    const isDocApproved = doc?.status === 'Aprobado';
                    const isDocRejected = doc?.status === 'Rechazado';

                    return (
                      <div key={req.code} className="p-4 transition-colors hover:bg-slate-50/50">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {isDocApproved ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                              ) : isDocRejected ? (
                                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                              ) : doc ? (
                                <FileCheck2 className="h-5 w-5 shrink-0 text-blue-600" />
                              ) : (
                                <FileX className="h-5 w-5 shrink-0 text-[var(--palette-a-80)]" />
                              )}
                              <h3 className="text-sm font-semibold text-[var(--palette-a)]">{req.title}</h3>
                            </div>

                            <p className="mt-1 text-xs text-[var(--palette-a-80)]">
                              Clave: <span className="font-mono">{req.code}</span> · Permitidos: {req.extensions.join(', ').toUpperCase()}
                            </p>

                            {doc ? (
                              <p className="mt-1 text-xs text-slate-600">
                                {doc.detail || doc.original_name}
                                {doc.identifier && <span className="ml-2 font-mono text-[10px] text-slate-400">Folio: {doc.identifier}</span>}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs italic text-[var(--palette-a-80)]">
                                Pendiente de entrega por parte del alumno
                              </p>
                            )}

                            {doc?.feedback && (
                              <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                                <strong>Observación registrada:</strong> {doc.feedback}
                              </div>
                            )}
                          </div>

                          {doc && (
                            <div className="flex flex-wrap items-center gap-2">
                              {isDocApproved && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                  Aprobado
                                </span>
                              )}
                              {isDocRejected && (
                                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                                  Rechazado
                                </span>
                              )}
                              {!isDocApproved && !isDocRejected && (
                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                                  {doc.status || 'Recibido'}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => void downloadPrivateFile(doc.file_url, `${req.title}.${req.extensions[0]}`)}
                                className="flex items-center gap-1 rounded border border-[var(--palette-f-60)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--palette-a)] hover:bg-[var(--palette-f-20)]"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver Archivo
                              </button>

                              {!isDocApproved && (
                                <button
                                  type="button"
                                  disabled={reviewingDocId === doc.id}
                                  onClick={() => handleReview(doc.id, 'Aprobado')}
                                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {reviewingDocId === doc.id ? 'Guardando...' : 'Aprobar'}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={reviewingDocId === doc.id}
                                onClick={() => {
                                  if (rejectingDocId === doc.id) {
                                    setRejectingDocId(null);
                                  } else {
                                    setRejectingDocId(doc.id);
                                    setFeedbackInput(doc.feedback || '');
                                  }
                                }}
                                className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {rejectingDocId === doc.id ? 'Cancelar' : 'Rechazar'}
                              </button>
                            </div>
                          )}
                        </div>

                        {rejectingDocId === doc?.id && (
                          <div className="mt-3 rounded-lg border border-red-200 bg-red-50/70 p-3">
                            <label className="block text-xs font-semibold text-red-900">
                              Indica el motivo del rechazo u observaciones para el alumno:
                              <textarea
                                required
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                placeholder="Ejemplo: Falta la firma del asesor interno en la portada..."
                                className="mt-1 block w-full rounded border border-red-300 bg-white px-3 py-2 text-xs text-slate-900"
                                rows={2}
                              />
                            </label>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                disabled={reviewingDocId === doc.id}
                                onClick={() => handleReview(doc.id, 'Rechazado', feedbackInput)}
                                className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                              >
                                Confirmar Rechazo
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingDocId(null)}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN DE PUBLICACIÓN EN ACCESO ABIERTO */}
              {approvedReport ? (
                <div className="rounded-lg border-2 border-emerald-500 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-base font-bold text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Publicar Informe en el Catálogo Público (Acceso Abierto)
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    El informe técnico está <strong>aprobado</strong>. Al presionar el botón se vinculará el archivo PDF al catálogo y estará disponible para descarga pública.
                  </p>

                  <form onSubmit={handlePublishApprovedReport} className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold sm:col-span-2">
                      Título Oficial de la Residencia
                      <input
                        required
                        value={publishFormTitle}
                        onChange={(e) => setPublishFormTitle(e.target.value)}
                        className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="text-xs font-semibold">
                      Autor
                      <input
                        disabled
                        value={selectedExpedient.student_name}
                        className="mt-1 block w-full rounded border border-[var(--palette-f-60)] bg-[var(--palette-f-20)] px-3 py-2 text-sm text-[var(--palette-a-80)]"
                      />
                    </label>

                    <label className="text-xs font-semibold">
                      Carrera
                      <input
                        disabled
                        value={selectedExpedient.career_name}
                        className="mt-1 block w-full rounded border border-[var(--palette-f-60)] bg-[var(--palette-f-20)] px-3 py-2 text-sm text-[var(--palette-a-80)]"
                      />
                    </label>

                    <label className="text-xs font-semibold sm:col-span-2">
                      Resumen Ejecutivo / Metadatos
                      <textarea
                        value={publishFormDesc}
                        onChange={(e) => setPublishFormDesc(e.target.value)}
                        placeholder="Escribe el resumen ejecutivo o palabras clave del proyecto..."
                        className="mt-1 block min-h-20 w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                      <button
                        type="submit"
                        disabled={publishing}
                        className="rounded bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {publishing ? 'Publicando en Catálogo...' : 'Publicar Ficha con PDF en el Repositorio'}
                      </button>
                      {publishMessage && (
                        <span className="text-xs font-semibold text-emerald-800">{publishMessage}</span>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-lg border border-[var(--palette-f-60)] bg-amber-50/80 p-4 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold">Publicación en repositorio no disponible aún</p>
                      <p className="mt-0.5 text-amber-800">
                        Para publicar esta residencia en el catálogo público, primero debes marcar como <strong>Aprobado</strong> el <em>Informe técnico de residencia (Word o PDF)</em>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LISTA DE EXPEDIENTES CON FILTROS */
            <div className="space-y-6">
              <div className="grid gap-3 rounded-lg border border-[var(--palette-f-60)] bg-white p-4 shadow-xs sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--palette-a-80)]">Carrera</label>
                  <select
                    value={filterCareer}
                    onChange={(e) => setFilterCareer(e.target.value)}
                    className="mt-1 block w-full rounded border border-[var(--palette-f-60)] bg-white px-2.5 py-1.5 text-xs text-[var(--palette-a)]"
                  >
                    <option value="">Todas las carreras</option>
                    {Object.entries(careers).map(([code, name]) => (
                      <option key={code} value={code}>{code} — {name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--palette-a-80)]">Periodo</label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="mt-1 block w-full rounded border border-[var(--palette-f-60)] bg-white px-2.5 py-1.5 text-xs text-[var(--palette-a)]"
                  >
                    <option value="">Todos los periodos</option>
                    {periods.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--palette-a-80)]">Año</label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-2.5 py-1.5 text-xs text-[var(--palette-a)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--palette-a-80)]">Buscar Alumno</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      placeholder="Nombre o correo..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchExpedients()}
                      className="block w-full rounded border border-[var(--palette-f-60)] px-2.5 py-1.5 pr-8 text-xs text-[var(--palette-a)]"
                    />
                    <button
                      type="button"
                      onClick={fetchExpedients}
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 hover:text-slate-600"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={fetchExpedients}
                    className="flex items-center gap-1.5 rounded bg-[var(--brand-red-100)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)]"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Aplicar Filtros
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[var(--palette-f-60)] bg-white shadow-xs">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="bg-[var(--palette-f-20)] text-left text-xs uppercase text-[var(--palette-a-80)]">
                    <tr>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">Carrera</th>
                      <th className="px-4 py-3">Periodo</th>
                      <th className="px-4 py-3">Documentos</th>
                      <th className="px-4 py-3">Aprobados</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--palette-f-60)]">
                    {loadingExpedients && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-xs text-slate-500">
                          Cargando expedientes...
                        </td>
                      </tr>
                    )}

                    {!loadingExpedients && expedients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-xs text-slate-500">
                          No se encontraron expedientes con los filtros seleccionados.
                        </td>
                      </tr>
                    )}

                    {!loadingExpedients && expedients.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--palette-a)]">{exp.student_name}</div>
                          <div className="text-xs text-[var(--palette-a-80)]">{exp.student_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {exp.career_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">
                          {exp.period}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--palette-f-60)]">
                              <div
                                className="h-full bg-[var(--brand-red-100)]"
                                style={{ width: `${Math.round((exp.completed / exp.total) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[var(--palette-a-80)]">
                              {exp.completed}/{exp.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            exp.approved === exp.total
                              ? 'bg-emerald-100 text-emerald-800'
                              : exp.approved > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {exp.approved} de {exp.total}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedExpedient(exp)}
                            className="inline-flex items-center gap-1 rounded border border-[var(--brand-red-100)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-red-100)] hover:bg-[var(--brand-red-20)]"
                          >
                            Auditar expediente
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CATÁLOGO PUBLICADO (NUEVA GESTIÓN TOTAL) */}
      {activeTab === 'catalog' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-base font-bold text-slate-900">
              Control de Publicaciones en el Repositorio Abierto
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por título, autor o carrera..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCatalogEntries()}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs w-64 shadow-xs"
              />
              <button
                type="button"
                onClick={fetchCatalogEntries}
                className="rounded bg-[var(--brand-red-100)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)]"
              >
                Buscar
              </button>
            </div>
          </div>

          {catalogMessage && (
            <div className="rounded bg-blue-50 p-2.5 text-xs font-medium text-blue-800">
              {catalogMessage}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Título de la Residencia</th>
                  <th className="px-4 py-3">Autor & Carrera</th>
                  <th className="px-4 py-3">Año</th>
                  <th className="px-4 py-3">Archivo PDF</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {catalogLoading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Cargando publicaciones...
                    </td>
                  </tr>
                )}
                {!catalogLoading && catalogEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No hay residencias publicadas aún.
                    </td>
                  </tr>
                )}
                {!catalogLoading && catalogEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">
                      {entry.title}
                      <div className="text-[10px] font-mono font-normal text-slate-400">UUID: {entry.identifier}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{entry.author || 'Sin autor'}</div>
                      <div className="text-[11px] text-slate-500">{entry.career}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.year}</td>
                    <td className="px-4 py-3">
                      {entry.file_url ? (
                        <a
                          href={entry.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="h-3 w-3" /> Descargar
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        entry.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {entry.published ? 'Publicado' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(entry.id)}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {entry.published ? 'Ocultar' : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="rounded border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50"
                          title="Eliminar publicación"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PUBLICACIÓN MANUAL (CON CARGA DE ARCHIVO PDF) */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualPublish} className="mt-6 grid gap-4 rounded-lg border border-[var(--palette-f-60)] bg-white p-6 shadow-xs md:grid-cols-2">
          <h2 className="text-base font-semibold md:col-span-2">Registrar Ficha Directa en el Repositorio</h2>
          <label className="text-xs font-semibold md:col-span-2">
            Título de la Residencia
            <input name="title" required maxLength={200} placeholder="Ej. Automatización del Proceso de Selección de Aguacate..." className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          </label>
          <input type="hidden" name="type" value="Residencia" />
          
          <label className="text-xs font-semibold">
            Autor(es)
            <input name="author" maxLength={200} placeholder="Ej. Ing. Juan Pérez García" className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          </label>

          <label className="text-xs font-semibold">
            Carrera
            <input name="career" maxLength={120} placeholder="Ej. Ingeniería en Sistemas Computacionales" className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          </label>

          <label className="text-xs font-semibold">
            Institución / Empresa
            <input name="institution" maxLength={180} defaultValue="TecNM Campus La Huerta" className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          </label>

          <label className="text-xs font-semibold">
            Año de Realización
            <input name="year" type="number" min="1990" max="2100" defaultValue={new Date().getFullYear()} required className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          </label>

          <label className="text-xs font-semibold md:col-span-2">
            Adjuntar Informe Técnico Completo (PDF o Word)
            <input type="file" name="file" accept=".pdf,.docx" className="mt-1 block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--brand-red-20)] file:text-[var(--brand-red-100)] hover:file:bg-[var(--brand-red-40)]" />
          </label>

          <label className="text-xs font-semibold md:col-span-2">
            Resumen / Descripción
            <textarea name="description" maxLength={5000} placeholder="Resumen del trabajo, metodología y aportaciones..." className="mt-1 block min-h-24 w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          </label>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button disabled={manualPublishing} className="rounded bg-[var(--brand-red-100)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-red-80)] disabled:opacity-60">
              {manualPublishing ? 'Publicando...' : 'Publicar en Repositorio'}
            </button>
            {manualPublishMessage && <p role="status" className="text-xs font-semibold text-emerald-800">{manualPublishMessage}</p>}
          </div>
        </form>
      )}

      {/* PESTAÑA 4: AUDITORÍA DE DOCUMENTOS */}
      {activeTab === 'recent' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--palette-f-60)] bg-white shadow-xs">
          <table className="w-full min-w-[650px] text-sm">
            <thead className="bg-[var(--palette-f-20)] text-left text-xs uppercase text-[var(--palette-a-80)]">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Archivo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--palette-f-60)]">
              {recentDocuments.map((document) => (
                <tr key={document.id}>
                  <td className="px-4 py-3 font-medium">{document.title}</td>
                  <td className="px-4 py-3">{document.student_name}</td>
                  <td className="px-4 py-3 text-[var(--palette-a-80)]">{document.email}</td>
                  <td className="px-4 py-3">{document.status}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void downloadPrivateFile(document.file_url, `${document.title}.pdf`)}
                      className="flex items-center gap-1 rounded border border-[var(--palette-f-60)] px-2 py-1 text-xs"
                    >
                      <Eye className="h-4 w-4" /> Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--palette-f-60)] bg-white p-4 shadow-xs">
      <div className="text-2xl font-bold text-[var(--brand-red-100)]">{value}</div>
      <div className="text-xs text-[var(--palette-a-80)]">{label}</div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('public');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [accountRole, setAccountRole] = useState('');
  const [catalogRevision, setCatalogRevision] = useState(0);

  function navigateToCatalog() {
    setCatalogRevision((revision) => revision + 1);
    setView('catalog');
  }

  function handleLoginSuccess(userData: { email: string; role: string }) {
    setIsLoginOpen(false);
    setAccountRole(userData.role);
    if (userData.role === 'admin') {
      setView('admin');
    } else if (userData.role === 'institutional') {
      setView('student');
    } else {
      setView('reader');
    }
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userSession');
    setAccountRole('');
    setView('public');
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      request<{ user: { email: string; role: string } }>('/user')
        .then((data) => {
          setAccountRole(data.user.role);
          if (data.user.role === 'admin') {
            setView('admin');
          } else if (data.user.role === 'institutional') {
            setView('student');
          } else {
            setView('reader');
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setAccountRole('');
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--palette-f-20)] text-[var(--palette-a)]">
      <Header
        isAuthenticated={Boolean(accountRole)}
        onNavigateToCatalog={navigateToCatalog}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {(view === 'public' || view === 'reader' || view === 'catalog') && (
        <PublicView
          key={catalogRevision}
          onOpenLogin={() => setIsLoginOpen(true)}
          isAuthenticated={Boolean(accountRole)}
        />
      )}
      {view === 'student' && <StudentView />}
      {view === 'admin' && <AdminView />}

      {isLoginOpen && (
        <AuthModal
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
