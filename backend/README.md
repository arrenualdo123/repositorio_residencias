<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Backend — Repositorio Institucional

API del repositorio académico y de residencias profesionales. Está construida con Laravel 12, PHP 8.2+, PostgreSQL y Laravel Sanctum.

## Requisitos

- PHP 8.2 o superior con extensiones `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`, `ctype` y `json`.
- Composer 2.
- PostgreSQL disponible localmente.
- Node.js/npm solo si también se van a compilar los recursos frontend que Laravel pudiera necesitar; el frontend principal vive en `../front`.

## Instalación local

Desde PowerShell, en la carpeta `backend`:

```powershell
composer install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
```

Edita `backend/.env` y configura la conexión a PostgreSQL. No uses las credenciales de ejemplo en un servidor compartido o de producción:

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=repositorio_residencias
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
FILESYSTEM_DISK=local
```

Crea la base de datos en PostgreSQL si todavía no existe. En `psql`, con un usuario que tenga permiso:

```sql
CREATE DATABASE repositorio_residencias;
```

Después, carga la configuración y aplica las migraciones:

```powershell
php artisan config:clear
php artisan migrate
php artisan migrate:status
```

`migrate` crea o actualiza tablas; no borra los registros existentes. **No ejecutes `migrate:fresh` sobre la base de desarrollo**, porque elimina todas sus tablas y datos.

## Ejecutar la API

En una terminal dentro de `backend`:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

La API local queda en `http://localhost:8000/api`. Mantén este proceso abierto mientras uses el frontend. En otra terminal inicia React:

```powershell
Set-Location ..\front
npm install
npm run dev
```

Vite mostrará la dirección del sitio, normalmente `http://localhost:5173`. El frontend usa `VITE_API_URL` si está definida; de lo contrario, utiliza `http://localhost:8000/api`.

Laravel no necesita un comando de “build de API” para desarrollo: `php artisan serve` levanta la API. `npm run build` pertenece al frontend de `../front`.

## Rutas principales

Consulta todas las rutas con:

```powershell
php artisan route:list --path=api
```

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| `POST` | `/api/register` | Público | Registrar cuenta; el backend asigna el rol por dominio de correo. |
| `POST` | `/api/login` | Público | Iniciar sesión y recibir token Sanctum. |
| `GET` | `/api/repository/search` | Público | Buscar fichas publicadas de residencias. Acepta `q`, `title`, `summary`, `career`, `year_from` y `year_to`. |
| `POST` | `/api/logout` | Token | Revocar el token actual. |
| `GET` | `/api/user` | Token | Consultar la cuenta autenticada. |
| `GET` | `/api/student/expedients` | Alumno institucional | Obtener expedientes, checklist y carreras disponibles. |
| `POST` | `/api/student/expedients` | Alumno institucional | Crear/seleccionar expediente enviando `career_code`, `period_name` y `year`. |
| `POST` | `/api/student/expedients/{id}/documents` | Dueño institucional | Subir archivo para una casilla con `requirement_code` y `file`. |
| `GET` | `/api/student/documents/{id}/file` | Dueño o admin | Descargar documento privado con token. |
| `GET` | `/api/admin/documents` | Admin | Consultar archivos cargados y conteos. |
| `POST` | `/api/admin/repository/entries` | Admin | Publicar ficha de residencia en el catálogo. |

Las rutas protegidas requieren `Authorization: Bearer <token>` y `Accept: application/json`.

## Roles y archivos

- El registro asigna `institutional` si el correo termina en `@lahuerta.tecmm.edu.mx`; los demás reciben `reader`. El rol enviado desde el navegador no concede privilegios.
- El backend permite cargar archivos solo a usuarios `institutional`. Esto comprueba el dominio, **no verifica la propiedad del buzón**; para verificar correo se necesitaría implementar confirmación por email.
- Los documentos se guardan en el disco privado local de Laravel, bajo `storage/app/private/student-documents/`. No ejecutes `php artisan storage:link` para estos archivos: no deben publicarse como recursos estáticos.
- El límite de aplicación es 10 MB. Los requisitos aceptan PDF; los dos archivos del informe técnico tienen requisitos separados DOCX y PDF.
- `requirement_code` identifica el requisito, por ejemplo `acceptance-letter`; cada ficha/archivo también tiene un UUID. El ID numérico de la base se conserva como clave interna.

## Cuenta administradora

El registro público nunca crea administradores. Para una instancia local, primero registra la cuenta y luego asígnale el rol desde PostgreSQL usando una cuenta autorizada:

```sql
UPDATE users SET role = 'admin' WHERE email = 'correo-administrador@institucion.edu';
```

No permitas que usuarios no autorizados ejecuten este cambio ni publiques credenciales administrativas.

## Pruebas

PHPUnit usa PostgreSQL y una base separada llamada `repositorio_residencias_test`. Créala una sola vez si falta:

```sql
CREATE DATABASE repositorio_residencias_test;
```

Ejecuta las pruebas desde `backend`:

```powershell
php artisan test
```

Las pruebas usan `RefreshDatabase` y pueden borrar/recrear tablas **dentro de `repositorio_residencias_test`**. Verifica que `phpunit.xml` conserve esa base de pruebas y nunca la cambies por `repositorio_residencias`.

## Comandos útiles

```powershell
php artisan config:clear
php artisan optimize:clear
php artisan route:list --path=api
php artisan migrate:status
php artisan migrate
php artisan test
```

## Problemas comunes

- **No conecta a PostgreSQL:** revisa `DB_HOST`, `DB_PORT`, base, usuario, contraseña y que PostgreSQL esté iniciado. Comprueba que PHP tenga `pdo_pgsql` habilitado.
- **`401 Unauthenticated`:** vuelve a iniciar sesión; el token debe enviarse como Bearer.
- **`403 Forbidden` al subir:** la cuenta no tiene el rol `institutional` o el endpoint requiere `admin`.
- **Error de validación al subir:** revisa el formato permitido para el requisito y el límite de 10 MB.
- **CORS:** el origen de Vite debe estar incluido en la configuración CORS de Laravel.
- **Cambiaste `.env` y no toma los valores:** ejecuta `php artisan config:clear` y reinicia `php artisan serve`.

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
