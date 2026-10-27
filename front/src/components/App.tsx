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
} from 'lucide-react';
import { AuthModal } from './AuthModal';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

type SearchResult = {
  id: number;
  identifier: string;
  title: string;
  type: string;
  meta: string;
  description?: string;
};

type SearchResponse = {
  data: SearchResult[];
  total: number;
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
    <header className="bg-[var(--brand-red-100)] text-white">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <button
          type="button"
          onClick={() => onNavigateToCatalog()}
          className="flex items-center gap-2 text-lg font-bold"
        >
          <Database className="h-5 w-5" />
          Repositorio
          <span className="font-normal opacity-80"> Institucional</span>
        </button>

        <nav className="hidden gap-6 text-sm md:flex">
          <button type="button" onClick={() => onNavigateToCatalog()}>Buscar</button>
          <button type="button" onClick={() => onNavigateToCatalog()}>Residencias</button>
        </nav>

        <button
          onClick={isAuthenticated ? onLogout : onOpenLogin}
          className="rounded bg-white px-3 py-2 text-xs font-semibold text-[var(--brand-red-100)] hover:bg-red-50"
        >
          {isAuthenticated ? 'Salir' : 'Identificarse'}
        </button>
      </div>
    </header>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function searchRepository(event?: FormEvent) {
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

    try {
      const data = await request<SearchResponse>(`/repository/search?${params}`);

      setResults(data.data);
      setTotal(data.total);
    } catch {
      setError('No se pudieron cargar los resultados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchRepository();
    void request<{ careers: Record<string, string> }>('/careers')
      .then((data) => setCareerOptions(data.careers))
      .catch(() => setCareerOptions({}));
  }, []);

  return (
    <main className="mx-auto grid w-full max-w-[1280px] justify-center gap-8 px-6 py-8 md:grid-cols-[220px_minmax(0,680px)_240px]">
      <aside className="space-y-6 text-sm">
        <h2 className="flex items-center gap-2 border-b border-[var(--palette-f-60)] pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--palette-a-80)]">
          Filtros
        </h2>

        <div className="rounded border border-[var(--palette-f-60)] bg-white px-3 py-2 text-sm">
          Tipo de documento<br /><strong>Residencias profesionales</strong>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Carrera</h3>
          <select value={career} onChange={(event) => setCareer(event.target.value)} className="w-full rounded border border-[var(--palette-f-60)] bg-white px-2 py-2">
            <option value="">Todas</option>
            {Object.entries(careerOptions).map(([code, name]) => (
              <option key={code} value={name}>{name}</option>
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
          <button type="button" onClick={() => void searchRepository()} className="mt-3 w-full rounded bg-[var(--brand-red-100)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-red-80)]">
            Aplicar filtros
          </button>
        </div>
      </aside>

      <section className="min-w-0">
        <h1 className="mb-3 text-xl font-bold">
          Buscar en el repositorio
        </h1>

        <form onSubmit={searchRepository} className="mb-5 flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Título, autor o palabra clave"
            className="flex-1 rounded border border-[var(--palette-f-60)] px-3 py-2"
          />

          <button
            type="submit"
            className="rounded bg-[var(--brand-red-100)] px-5 font-semibold text-white hover:bg-[var(--brand-red-80)]"
          >
            Buscar
          </button>
        </form>

        <details className="mb-5 rounded border border-[var(--palette-f-60)] bg-white px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold">Búsqueda avanzada por título y resumen</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--palette-a-80)]">
              Título
              <input value={titleFilter} onChange={(event) => setTitleFilter(event.target.value)} className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm text-[var(--palette-a)]" placeholder="Palabras del título" />
            </label>
            <label className="text-xs font-medium text-[var(--palette-a-80)]">
              Resumen
              <input value={summaryFilter} onChange={(event) => setSummaryFilter(event.target.value)} className="mt-1 block w-full rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm text-[var(--palette-a)]" placeholder="Palabras del resumen" />
            </label>
            <button type="button" onClick={() => void searchRepository()} className="rounded bg-[var(--brand-red-100)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-red-80)] sm:col-span-2">
              Aplicar búsqueda avanzada
            </button>
          </div>
        </details>

        <p id="repository-count" className="mb-3 text-sm text-[var(--palette-a-80)]">
          {loading ? 'Buscando...' : `${total} resultados encontrados`}
        </p>

        {loading && (
          <p className="text-sm text-[var(--palette-a-80)]">
            Cargando resultados...
          </p>
        )}

        {error && <p className="text-sm text-[var(--palette-d)]">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-[var(--palette-a-80)]">
            No se encontraron resultados.
          </p>
        )}

        <div className="divide-y divide-[var(--palette-f-60)] border-t border-[var(--palette-f-60)]">
          {results.map((result) => (
            <article key={result.id} className="py-4">
              <h2 className="font-semibold text-[var(--brand-red-100)]">
                {result.title}

                <span className="ml-2 rounded-full border border-[var(--palette-f-60)] px-2 py-1 text-xs text-[var(--palette-a-80)]">
                  {result.type}
                </span>
              </h2>

              <p className="mt-1 text-[11px] text-[var(--palette-a-80)]">Folio: {result.identifier}</p>

              <p className="mt-1 text-sm text-[var(--palette-a-80)]">
                {result.meta}
              </p>

              {result.description && (
                <p className="mt-1 text-sm">{result.description}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <aside className="h-fit w-full rounded-lg border border-[var(--palette-f-60)] bg-white p-5 text-center">
        {isAuthenticated ? (
          <>
            <h2 className="mb-2 font-semibold">Acceso de lectura</h2>
            <p className="text-sm text-[var(--palette-a-80)]">
              Tu cuenta puede consultar el catálogo público. La carga de documentos requiere correo institucional.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-4 font-semibold">Acceso alumnos</h2>
            <button
              onClick={onOpenLogin}
              className="w-full rounded bg-[var(--brand-red-100)] py-2 font-semibold text-white hover:bg-[var(--brand-red-80)]"
            >
              Identificarse
            </button>
          </>
        )}
      </aside>
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
          <p className="text-sm text-[var(--palette-a-80)]">Tus archivos solo son visibles para ti y el administrador.</p>
        </div>

        <div className="flex h-fit items-center gap-2 rounded-full border border-[var(--brand-red-40)] bg-[var(--brand-red-20)] px-3 py-2 text-xs font-semibold text-[var(--brand-red-100)]">
          <Lock className="h-4 w-4" />
          Privado
        </div>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-[var(--palette-d)]">{error}</p>}

      {!profileCareerCode && !loading && (
        <form onSubmit={saveProfileCareer} className="mb-6 grid gap-4 rounded-lg border border-[var(--palette-f-60)] bg-white p-5">
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
        <form onSubmit={createExpedient} className="mb-6 grid gap-4 rounded-lg border border-[var(--palette-f-60)] bg-white p-5 sm:grid-cols-2">
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

          <div className="divide-y divide-[var(--palette-f-60)] overflow-hidden rounded-lg border border-[var(--palette-f-60)] bg-white">
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
          <h2 className="mb-2 text-sm font-semibold">Archivos subidos anteriormente (sin requisito asignado)</h2>
          <div className="divide-y divide-[var(--palette-f-60)] overflow-hidden rounded-lg border border-[var(--palette-f-60)] bg-white">
            {legacyDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-[var(--palette-a-80)]">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Los archivos se guardan de forma privada y solo pueden descargarse con una sesión autorizada.
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
              <p className="font-semibold text-red-800">Observaciones del Administrador / Asesor:</p>
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
  const [activeTab, setActiveTab] = useState<'expedients' | 'recent' | 'manual'>('expedients');
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

  useEffect(() => {
    void loadSummaryAndRecent();
    void fetchExpedients();
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
    const payload = Object.fromEntries(form.entries());

    try {
      await request('/admin/repository/entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      formElement.reset();
      setManualPublishMessage('Ficha publicada; ya aparece en el buscador público.');
    } catch {
      setManualPublishMessage('No se pudo publicar. Revisa los campos e intenta otra vez.');
    } finally {
      setManualPublishing(false);
    }
  }

  // Set default title for direct publish when selecting an expedient
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
            Supervisión de expedientes, revisión documental y publicación en el catálogo abierto.
          </p>
        </div>
      </div>

      {summary && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Summary label="Alumnos activos" value={summary.active_students} />
          <Summary label="Documentos subidos" value={summary.uploaded_documents} />
          <Summary label="Documentos en revisión" value={summary.documents_under_review} />
        </div>
      )}

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-[var(--palette-d)]">{error}</p>}

      {/* Navegación por pestañas */}
      <div className="mt-8 flex gap-2 border-b border-[var(--palette-f-60)]">
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
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'recent'
              ? 'border-[var(--brand-red-100)] text-[var(--brand-red-100)]'
              : 'border-transparent text-[var(--palette-a-80)] hover:text-[var(--palette-a)]'
          }`}
        >
          <Clock className="h-4 w-4" />
          Documentos Recientes
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
      </div>

      {/* PESTAÑA 1: EXPEDIENTES POR PERIODO */}
      {activeTab === 'expedients' && (
        <div className="mt-6">
          {/* DETALLE DE UN EXPEDIENTE SELECCIONADO */}
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

              <div className="rounded-lg border border-[var(--palette-f-60)] bg-white p-6 shadow-sm">
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
                      {selectedExpedient.approved} aprobados
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
              <div className="overflow-hidden rounded-lg border border-[var(--palette-f-60)] bg-white">
                <div className="border-b border-[var(--palette-f-60)] bg-[var(--palette-f-20)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--palette-a-80)]">
                  Checklist de Documentos del Alumno (Modo Revisión)
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

                          {/* ACCIONES DE REVISIÓN */}
                          {doc && (
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Estatus Pill */}
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

                              {/* Botón Ver */}
                              <button
                                type="button"
                                onClick={() => void downloadPrivateFile(doc.file_url, `${req.title}.${req.extensions[0]}`)}
                                className="flex items-center gap-1 rounded border border-[var(--palette-f-60)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--palette-a)] hover:bg-[var(--palette-f-20)]"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Descargar
                              </button>

                              {/* Botón Aprobar */}
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

                              {/* Botón Rechazar */}
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

                        {/* CAJA DESPLEGABLE PARA MOTIVO DE RECHAZO */}
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
                    Publicar Informe en el Repositorio Institucional (Acceso Abierto)
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    El informe técnico de esta residencia ha sido <strong>aprobado</strong>. Completa la ficha de metadatos para difundirla en el catálogo público.
                  </p>

                  <form onSubmit={handlePublishApprovedReport} className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold sm:col-span-2">
                      Título de la Residencia
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
                      Resumen / Descripción
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
                        {publishing ? 'Publicando en Catálogo...' : 'Publicar Ficha en Repositorio Público'}
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
                        Para publicar esta residencia en el catálogo público, primero debes revisar y marcar como <strong>Aprobado</strong> el requisito del <em>Informe técnico de residencia (Word o PDF)</em>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LISTA DE EXPEDIENTES CON FILTROS */
            <div className="space-y-6">
              {/* Barra de Filtros */}
              <div className="grid gap-3 rounded-lg border border-[var(--palette-f-60)] bg-white p-4 sm:grid-cols-2 md:grid-cols-4">
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

              {/* Tabla de Expedientes */}
              <div className="overflow-x-auto rounded-lg border border-[var(--palette-f-60)] bg-white shadow-sm">
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
                            Revisar expediente
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

      {/* PESTAÑA 2: DOCUMENTOS RECIENTES */}
      {activeTab === 'recent' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--palette-f-60)] bg-white shadow-sm">
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

      {/* PESTAÑA 3: PUBLICACIÓN MANUAL */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualPublish} className="mt-6 grid gap-3 rounded-lg border border-[var(--palette-f-60)] bg-white p-6 shadow-sm md:grid-cols-2">
          <h2 className="text-base font-semibold md:col-span-2">Publicar ficha manualmente en el catálogo</h2>
          <input name="title" required maxLength={200} placeholder="Título" className="rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          <input type="hidden" name="type" value="Residencia" />
          <p className="rounded border border-[var(--palette-f-60)] bg-[var(--palette-f-20)] px-3 py-2 text-sm">Tipo: Residencia profesional</p>
          <input name="author" maxLength={200} placeholder="Autor (opcional)" className="rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          <input name="career" maxLength={120} placeholder="Carrera (opcional)" className="rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          <input name="institution" maxLength={180} placeholder="Institución (opcional)" className="rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          <input name="year" type="number" min="1900" max="2100" required placeholder="Año" className="rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm" />
          <textarea name="description" maxLength={5000} placeholder="Resumen / descripción (opcional)" className="min-h-20 rounded border border-[var(--palette-f-60)] px-3 py-2 text-sm md:col-span-2" />
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button disabled={manualPublishing} className="rounded bg-[var(--brand-red-100)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-red-80)] disabled:opacity-60">
              {manualPublishing ? 'Publicando...' : 'Publicar ficha'}
            </button>
            {manualPublishMessage && <p role="status" className="text-sm text-[var(--palette-a-80)]">{manualPublishMessage}</p>}
          </div>
        </form>
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
    <div className="rounded-lg border border-[var(--palette-f-60)] bg-white p-4">
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