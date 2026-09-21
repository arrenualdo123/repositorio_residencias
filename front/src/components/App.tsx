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
  title: string;
  type: string;
  meta: string;
  description?: string;
};

type StudentDocument = {
  id: number;
  title: string;
  detail: string;
  status: string;
  file_url?: string;
};

type StudentExpedient = {
  title: string;
  student_name: string;
  career: string;
  completed: number;
  total: number;
  documents: StudentDocument[];
};

type AdminSummary = {
  active_students: number;
  completed_expedients: number;
  pending_documents: number;
  correction_requests: number;
};

type Expedient ={
  id: number;
  student_name: string;
  career: string;
  completed: number;
  total: number;
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
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error('No fue posible obtener la información');
  }

  return response.json();
}

function Header({
  view,
  onOpenLogin,
  onLogout,
}: {
  view: string;
  onOpenLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="bg-[#a01824] text-white">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Database className="h-5 w-5" />
          Repositorio
          <span className="font-normal opacity-80"> Institucional</span>
        </div>

        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#buscar">Buscar</a>
          <a href="#tesis">Tesis</a>
          <a href="#residencias">Residencias</a>
          <a href="#metricas">Métricas</a>
        </nav>

        <button
          onClick={view === 'public' ? onOpenLogin : onLogout}
          className="rounded bg-white px-3 py-2 text-xs font-semibold text-[#a01824]"
        >
          {view === 'public' ? 'Identificarse' : 'Salir'}
        </button>
      </div>
    </header>
  );
}

function PublicView({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function searchRepository(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await request<{ data: SearchResult[] }>(
        `/repository/search?q=${encodeURIComponent(query)}`,
      );

      setResults(data.data);
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

        <div>
          <h3 className="mb-2 font-semibold">Tipo de documento</h3>

          <label className="block py-1">
            <input type="checkbox" className="mr-2 accent-[#a01824]" />
            Tesis
          </label>

          <label className="block py-1">
            <input type="checkbox" className="mr-2 accent-[#a01824]" />
            Residencias profesionales
          </label>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Carrera</h3>

          <label className="block py-1">
            <input type="checkbox" className="mr-2 accent-[#a01824]" />
            Sistemas Computacionales
          </label>

          <label className="block py-1">
            <input type="checkbox" className="mr-2 accent-[#a01824]" />
            Ingeniería Industrial
          </label>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Rango de años</h3>

          {['2020 - 2029', '2010 - 2019', '2000 - 2009', '1990 - 1999', '1980 - 1989'].map((period) => (
            <label key={period} className="flex items-center gap-2 py-1">
              <input type="checkbox" className="accent-[#a01824]" />
              <span>{period}</span>
            </label>
          ))}
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
        <h2 className="mb-4 font-semibold">Acceso alumnos</h2>

        <button
          onClick={onOpenLogin}
          className="w-full rounded bg-[#a01824] py-2 font-semibold text-white"
        >
          Identificarse
        </button>
      </aside>
    </main>
  );
}

function StudentView() {
  const [expedient, setExpedient] =
    useState<StudentExpedient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<StudentExpedient>('/student/expedient')
      .then(setExpedient)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-8">Cargando expediente...</p>;
  }

  if (!expedient) {
    return <p className="p-8">No hay expediente disponible.</p>;
  }

  const progress = Math.round(
    (expedient.completed / expedient.total) * 100,
  );

  return (
    <main className="mx-auto max-w-[980px] px-6 py-8">
      <div className="mb-6 flex justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{expedient.title}</h1>

          <p className="text-sm text-[#6b6b6b]">
            {expedient.student_name} · {expedient.career}
          </p>
        </div>

        <div className="flex h-fit items-center gap-2 rounded-full bg-[#fdf0ef] px-3 py-2 text-xs font-semibold text-[#a01824]">
          <Lock className="h-4 w-4" />
          Privado
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-1 flex justify-between text-xs text-[#6b6b6b]">
          <span>Progreso del expediente</span>
          <span>
            {expedient.completed} de {expedient.total}
          </span>
        </div>

        <div className="h-2 rounded-full bg-[#e2e0da]">
          <div
            className="h-full rounded-full bg-[#a01824]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-[#e2e0da] overflow-hidden rounded-lg border border-[#e2e0da] bg-white">
        {expedient.documents.map((document) => (
          <DocumentRow key={document.id} document={document} />
        ))}
      </div>
    </main>
  );
}

function DocumentRow({
  document,
}: {
  document: StudentDocument;
}) {
  const received = document.status === 'Recibido';
  const pending = document.status === 'Pendiente';

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
        <p className="text-xs text-[#6b6b6b]">{document.detail}</p>
      </div>

      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
        {document.status}
      </span>

      {received && document.file_url && (
        <a
          href={document.file_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded border border-[#e2e0da] px-2 py-1 text-xs"
        >
          <Eye className="h-4 w-4" />
          Ver
        </a>
      )}

      {pending && (
        <button className="flex items-center gap-1 rounded bg-[#a01824] px-3 py-2 text-xs text-white">
          <Upload className="h-4 w-4" />
          Subir
        </button>
      )}
    </div>
  );
}

function AdminView() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [expedients, setExpedients] = useState<Expedient[]>([]);

  useEffect(() => {
    request<{
      summary: AdminSummary;
      expedients: Expedient[];
    }>('/admin/expedients').then((data) => {
      setSummary(data.summary);
      setExpedients(data.expedients);
    });
  }, []);

  if (!summary) {
    return <p className="p-8">Cargando administración...</p>;
  }

  return (
    <main className="mx-auto max-w-[1180px] px-6 py-8">
      <h1 className="text-xl font-bold">
        Administración de residencias
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Summary label="Alumnos activos" value={summary.active_students} />
        <Summary
          label="Expedientes completos"
          value={summary.completed_expedients}
        />
        <Summary
          label="Documentos pendientes"
          value={summary.pending_documents}
        />
        <Summary
          label="Solicitudes de corrección"
          value={summary.correction_requests}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[#e2e0da] bg-white">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-[#faf9f6] text-left text-xs uppercase text-[#6b6b6b]">
            <tr>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Carrera</th>
              <th className="px-4 py-3">Progreso</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e2e0da]">
            {expedients.map((expedient) => (
              <tr key={expedient.id}>
                <td className="px-4 py-3 font-medium">
                  {expedient.student_name}
                </td>
                <td className="px-4 py-3 text-[#6b6b6b]">
                  {expedient.career}
                </td>
                <td className="px-4 py-3">
                  {expedient.completed}/{expedient.total}
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

  function handleLoginSuccess(userData: { email: string; role: string }) {
    setIsLoginOpen(false);
    setView(userData.role === 'admin' ? 'admin' : 'student');
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userSession');
    setView('public');
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#1e1e1e]">
      <Header
        view={view}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {view === 'public' && (
        <PublicView onOpenLogin={() => setIsLoginOpen(true)} />
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