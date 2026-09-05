# Repositorio Residencias
Sistema web estructurado en carpetas independientes para el **Frontend** (`/front`) y **Backend** (`/back`).

---

## Configuración del Frontend (`/front`)
> **Importante:** Todos los comandos de esta sección deben ejecutarse dentro de la carpeta `front` para evitar errores de contexto en el entorno de desarrollo.

### 1. Requisitos Previos
* **Gestor de paquetes obligatorio:** `npm` (incluido con Node.js v18+).

---

### 2. Instalación de Dependencias
Navega a la carpeta del cliente e instala las dependencias del proyecto junto con los tipos de TypeScript para React:

```bash
cd front
npm install
npm install -D @types/react @types/react-dom
```

### 3. Verificación de Tipos (TypeScript)
Para comprobar que el código no tenga errores de compilación antes de levantar el servidor, ejecuta:

```bash
npx tsc -b
```

### 4. Iniciar el Servidor de Desarrollo
Inicia el servidor local de Vite:

```bash
npm run dev
```
La aplicación estará disponible habitualmente en http://localhost:5173.
