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
  file_url?: string;
};

type RequirementFile = {
  id: number;
  identifier: string;
  detail: string;
  status: string;
  file_url: string;
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
    throw new Error('No fue posible obtener la información');
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
    <header className="bg-[#a01824] text-white">
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
          <button
            type="button"
            onClick={() => {
              onNavigateToCatalog();
              window.setTimeout(() => {
                document.getElementById('repository-count')?.scrollIntoView({ behavior: 'smooth' });
              }, 0);
            }}
          >
            Métricas
          </button>
        </nav>

        <button
          onClick={isAuthenticated ? onLogout : onOpenLogin}
          className="rounded bg-white px-3 py-2 text-xs font-semibold text-[#a01824]"
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
  }, []);

  return (
    <main className="mx-auto grid w-full max-w-[1280px] justify-center gap-8 px-6 py-8 md:grid-cols-[220px_minmax(0,680px)_240px]">
      <aside className="space-y-6 text-sm">
        <h2 className="flex items-center gap-2 border-b border-[#e2e0da] pb-3 text-xs font-semibold uppercase tracking-wide text-[#6b6b6b]">
          Filtros
        </h2>

        <div className="rounded border border-[#e2e0da] bg-white px-3 py-2 text-sm">
          Tipo de documento<br /><strong>Residencias profesionales</strong>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Carrera</h3>
          <select value={career} onChange={(event) => setCareer(event.target.value)} className="w-full rounded border border-[#e2e0da] bg-white px-2 py-2">
            <option value="">Todas</option>
            <option value="Ingeniería en Sistemas Computacionales">Sistemas Computacionales</option>
            <option value="Ingeniería Industrial">Ingeniería Industrial</option>
            <option value="Contador Público">Contador Público</option>
            <option value="Gastronomía">Gastronomía</option>
          </select>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Rango de años</h3>
          <label className="mb-2 block text-xs text-[#6b6b6b]">
            Desde
            <input type="number" min="1900" max="2100" value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} className="mt-1 w-full rounded border border-[#e2e0da] px-2 py-1.5 text-sm text-[#1e1e1e]" />
          </label>
          <label className="block text-xs text-[#6b6b6b]">
            Hasta
            <input type="number" min="1900" max="2100" value={yearTo} onChange={(event) => setYearTo(event.target.value)} className="mt-1 w-full rounded border border-[#e2e0da] px-2 py-1.5 text-sm text-[#1e1e1e]" />
          </label>
          <button type="button" onClick={() => void searchRepository()} className="mt-3 w-full rounded bg-[#a01824] px-3 py-2 text-xs font-semibold text-white">
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
            className="flex-1 rounded border border-[#e2e0da] px-3 py-2"
          />

          <button
            type="submit"
            className="rounded bg-[#a01824] px-5 font-semibold text-white"
          >
            Buscar
          </button>
        </form>

        <details className="mb-5 rounded border border-[#e2e0da] bg-white px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold">Búsqueda avanzada por título y resumen</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#6b6b6b]">
              Título
              <input value={titleFilter} onChange={(event) => setTitleFilter(event.target.value)} className="mt-1 block w-full rounded border border-[#e2e0da] px-3 py-2 text-sm text-[#1e1e1e]" placeholder="Palabras del título" />
            </label>
            <label className="text-xs font-medium text-[#6b6b6b]">
              Resumen
              <input value={summaryFilter} onChange={(event) => setSummaryFilter(event.target.value)} className="mt-1 block w-full rounded border border-[#e2e0da] px-3 py-2 text-sm text-[#1e1e1e]" placeholder="Palabras del resumen" />
            </label>
            <button type="button" onClick={() => void searchRepository()} className="rounded bg-[#a01824] px-3 py-2 text-sm font-semibold text-white sm:col-span-2">
              Aplicar búsqueda avanzada
            </button>
          </div>
        </details>

        <p id="repository-count" className="mb-3 text-sm text-[#6b6b6b]">
          {loading ? 'Buscando...' : `${total} resultados encontrados`}
        </p>

        {loading && (
          <p className="text-sm text-[#6b6b6b]">
            Cargando resultados...
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-[#6b6b6b]">
            No se encontraron resultados.
          </p>
        )}

        <div className="divide-y divide-[#e2e0da] border-t border-[#e2e0da]">
          {results.map((result) => (
            <article key={result.id} className="py-4">
              <h2 className="font-semibold text-[#a01824]">
                {result.title}

                <span className="ml-2 rounded-full border border-[#e2e0da] px-2 py-1 text-xs text-[#6b6b6b]">
                  {result.type}
                </span>
              </h2>

              <p className="mt-1 text-[11px] text-[#777]">Folio: {result.identifier}</p>

              <p className="mt-1 text-sm text-[#6b6b6b]">
                {result.meta}
              </p>

              {result.description && (
                <p className="mt-1 text-sm">{result.description}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <aside className="h-fit w-full rounded-lg border border-[#e2e0da] bg-white p-5 text-center">
        {isAuthenticated ? (
          <>
            <h2 className="mb-2 font-semibold">Acceso de lectura</h2>
            <p className="text-sm text-[#6b6b6b]">
              Tu cuenta puede consultar el catálogo público. La carga de documentos requiere correo institucional.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-4 font-semibold">Acceso alumnos</h2>
            <button
              onClick={onOpenLogin}
              className="w-full rounded bg-[#a01824] py-2 font-semibold text-white"
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
  const [periods, setPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [careerCode, setCareerCode] = useState('');
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
        careers: Record<string, string>;
        periods: string[];
      }>('/student/expedients');

      setExpedients(data.expedients);
      setLegacyDocuments(data.legacy_documents);
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
        body: JSON.stringify({ career_code: careerCode, period_name: periodName, year: Number(year) }),
      });
      setSelectedExpedientId(data.expedient.id);
      await refreshExpedients();
    } catch {
      setError('No se pudo crear el expediente. Revisa carrera y periodo.');
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
          <p className="text-sm text-[#6b6b6b]">Tus archivos solo son visibles para ti y el administrador.</p>
        </div>

        <div className="flex h-fit items-center gap-2 rounded-full bg-[#fdf0ef] px-3 py-2 text-xs font-semibold text-[#a01824]">
          <Lock className="h-4 w-4" />
          Privado
        </div>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}

      {!selectedExpedient && !loading && (
        <form onSubmit={createExpedient} className="mb-6 grid gap-4 rounded-lg border border-[#e2e0da] bg-white p-5 sm:grid-cols-2">
          <h2 className="text-base font-semibold sm:col-span-2">Configura tu expediente</h2>
          <label className="text-sm font-medium">
            Carrera
            <select required value={careerCode} onChange={(event) => setCareerCode(event.target.value)} className="mt-1 block w-full rounded border border-[#e2e0da] bg-white px-3 py-2 font-normal">
              <option value="">Selecciona tu carrera</option>
              {Object.entries(careers).map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Periodo
            <div className="mt-1 flex gap-2">
              <select required value={periodName} onChange={(event) => setPeriodName(event.target.value)} className="min-w-0 flex-1 rounded border border-[#e2e0da] bg-white px-3 py-2 font-normal">
                {periods.map((period) => <option key={period} value={period}>{period}</option>)}
              </select>
              <input aria-label="Año del periodo" required type="number" min="2020" max={new Date().getFullYear() + 1} value={year} onChange={(event) => setYear(event.target.value)} className="w-24 rounded border border-[#e2e0da] px-3 py-2 font-normal" />
            </div>
          </label>
          <button disabled={creating || !careers[careerCode] || !periodName} className="rounded bg-[#a01824] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">
            {creating ? 'Creando expediente...' : 'Crear expediente'}
          </button>
        </form>
      )}

      {selectedExpedient && (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold">{selectedExpedient.career_code} · {selectedExpedient.period}</h2>
              <p className="text-sm text-[#6b6b6b]">{selectedExpedient.career}</p>
            </div>
            {expedients.length > 1 && (
              <label className="text-xs text-[#6b6b6b]">
                Cambiar expediente
                <select value={selectedExpedient.id} onChange={(event) => setSelectedExpedientId(Number(event.target.value))} className="ml-2 rounded border border-[#e2e0da] bg-white px-2 py-1.5 text-sm text-[#1e1e1e]">
                  {expedients.map((expedient) => <option key={expedient.id} value={expedient.id}>{expedient.career_code} · {expedient.period}</option>)}
                </select>
              </label>
            )}
          </div>

          <div className="mb-2 flex justify-between text-xs text-[#6b6b6b]">
            <span>Progreso del expediente</span>
            <span>{selectedExpedient.completed} de {selectedExpedient.total} documentos</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#e2e0da]">
            <div className="h-full bg-[#a01824] transition-[width]" style={{ width: `${progress}%` }} />
          </div>

          <div className="divide-y divide-[#e2e0da] overflow-hidden rounded-lg border border-[#e2e0da] bg-white">
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
          <div className="divide-y divide-[#e2e0da] overflow-hidden rounded-lg border border-[#e2e0da] bg-white">
            {legacyDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-[#6b6b6b]">
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

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      {requirement.document ? (
        <FileCheck2 className="h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <FileX className="h-5 w-5 shrink-0 text-[#6b6b6b]" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium">{requirement.title}</h3>
        <p className="text-[11px] text-[#777]">Clave de requisito: {requirement.code}{requirement.document ? ` · Folio: ${requirement.document.identifier}` : ''}</p>
        <p className="text-xs text-[#6b6b6b]">
          {requirement.document?.detail ?? `Pendiente de subir · ${requirement.extensions.join(' / ').toUpperCase()}`}
        </p>
        {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
      {requirement.document ? (
        <>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Recibido</span>
          <button onClick={() => void downloadPrivateFile(requirement.document!.file_url, `${requirement.title}.${requirement.extensions[0]}`)} className="flex items-center gap-1 rounded border border-[#e2e0da] px-2 py-1 text-xs">
            <Eye className="h-4 w-4" /> Ver
          </button>
        </>
      ) : (
        <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
          <input type="file" required accept={requirement.extensions.map((extension) => `.${extension}`).join(',')} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="max-w-48 text-xs" />
          <button disabled={uploading} className="flex items-center gap-1 rounded bg-[#a01824] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            <Upload className="h-3.5 w-3.5" /> {uploading ? 'Subiendo...' : 'Subir'}
          </button>
        </form>
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
        <FileCheck2 className="h-5 w-5 text-emerald-600" />
      ) : pending ? (
        <FileX className="h-5 w-5 text-[#6b6b6b]" />
      ) : (
        <Clock className="h-5 w-5 text-amber-600" />
      )}

      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-medium">{document.title}</h2>
        <p className="text-xs text-[#6b6b6b]">{document.detail}{document.identifier ? ` · Folio ${document.identifier.slice(0, 8)}` : ''}</p>
      </div>

      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
        {document.status}
      </span>

      {received && document.file_url && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 rounded border border-[#e2e0da] px-2 py-1 text-xs"
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
      )}

      {pending && (
        <button className="flex items-center gap-1 rounded bg-[#a01824] px-3 py-2 text-xs text-white">
          <Upload className="h-4 w-4" />
          Subir
        </button>
      )}

      {downloadError && <span className="text-xs text-red-700">{downloadError}</span>}
    </div>
  );
}

function AdminView() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [error, setError] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    request<{
      summary: AdminSummary;
      documents: AdminDocument[];
    }>('/admin/documents')
      .then((data) => {
        setSummary(data.summary);
        setDocuments(data.documents);
      })
      .catch(() => setError('No se pudieron cargar los documentos administrativos.'));
  }, []);

  if (!summary && !error) {
    return <p className="p-8">Cargando administración...</p>;
  }

  if (error || !summary) return <p className="p-8 text-red-700">{error}</p>;

  async function publishEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishing(true);
    setPublishMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    try {
      await request('/admin/repository/entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      formElement.reset();
      setPublishMessage('Ficha publicada; ya aparece en el buscador público.');
    } catch {
      setPublishMessage('No se pudo publicar. Revisa los campos e intenta otra vez.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-8">
      <h1 className="text-xl font-bold">
        Administración de residencias
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Summary label="Alumnos activos" value={summary.active_students} />
        <Summary
          label="Documentos subidos"
          value={summary.uploaded_documents}
        />
        <Summary
          label="Documentos en revisión"
          value={summary.documents_under_review}
        />
      </div>

      <form onSubmit={publishEntry} className="mt-6 grid gap-3 rounded-lg border border-[#e2e0da] bg-white p-4 md:grid-cols-2">
        <h2 className="text-base font-semibold md:col-span-2">Publicar ficha en el catálogo</h2>
        <input name="title" required maxLength={200} placeholder="Título" className="rounded border border-[#e2e0da] px-3 py-2 text-sm" />
        <input type="hidden" name="type" value="Residencia" />
        <p className="rounded border border-[#e2e0da] bg-[#faf9f6] px-3 py-2 text-sm">Tipo: Residencia profesional</p>
        <input name="author" maxLength={200} placeholder="Autor (opcional)" className="rounded border border-[#e2e0da] px-3 py-2 text-sm" />
        <input name="career" maxLength={120} placeholder="Carrera (opcional)" className="rounded border border-[#e2e0da] px-3 py-2 text-sm" />
        <input name="institution" maxLength={180} placeholder="Institución (opcional)" className="rounded border border-[#e2e0da] px-3 py-2 text-sm" />
        <input name="year" type="number" min="1900" max="2100" required placeholder="Año" className="rounded border border-[#e2e0da] px-3 py-2 text-sm" />
        <textarea name="description" maxLength={5000} placeholder="Resumen / descripción (opcional)" className="min-h-20 rounded border border-[#e2e0da] px-3 py-2 text-sm md:col-span-2" />
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button disabled={publishing} className="rounded bg-[#a01824] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {publishing ? 'Publicando...' : 'Publicar ficha'}
          </button>
          {publishMessage && <p role="status" className="text-sm text-[#6b6b6b]">{publishMessage}</p>}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[#e2e0da] bg-white">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-[#faf9f6] text-left text-xs uppercase text-[#6b6b6b]">
            <tr>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Archivo</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e2e0da]">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-3 font-medium">{document.title}</td>
                <td className="px-4 py-3">{document.student_name}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{document.email}</td>
                <td className="px-4 py-3">{document.status}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => void downloadPrivateFile(document.file_url, `${document.title}.pdf`)}
                    className="flex items-center gap-1 rounded border border-[#e2e0da] px-2 py-1 text-xs"
                  >
                    <Eye className="h-4 w-4" /> Descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <div className="rounded-lg border border-[#e2e0da] bg-white p-4">
      <div className="text-2xl font-bold text-[#a01824]">{value}</div>
      <div className="text-xs text-[#6b6b6b]">{label}</div>
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

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#1e1e1e]">
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