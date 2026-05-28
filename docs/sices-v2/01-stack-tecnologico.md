# 01 — Stack tecnológico

## Backend

| Componente | Versión / paquete | Archivo clave |
|------------|-------------------|---------------|
| PHP | ^8.3 | `composer.json` |
| Laravel | ^13 (13.6 en lock) | `composer.json` |
| Sanctum | ^4 | API tokens |
| Spatie Permission | ^7 | Roles/permisos |
| Spatie Activity Log | ^4 | Auditoría |
| Guzzle | ^7 | HTTP externo (SINCE) |
| DomPDF | ^3 | PDF |
| Maatwebsite Excel | ^3 | Exportaciones |
| Browsershot | ^5 | Render PDF/HTML |
| Pest / PHPUnit | dev | `tests/` |
| Larastan | dev | Análisis estático |
| Telescope | dev | Debug (no prod) |

## Frontend

| Componente | Versión | Archivo clave |
|------------|---------|---------------|
| React | ^19.1 | `package.json` |
| React Router | ^7.6 | `resources/js/router.jsx` |
| Axios | ^1.9 | `resources/js/bootstrap.js` |
| Vite | ^8 | `vite.config.js` |
| Tailwind CSS | ^4 | `resources/css/app.css` |
| Laravel Vite Plugin | ^3 | Entrada `resources/js/app.js` |

**No se usa:** Redux, React Query, Zustand, MUI, Bootstrap JS.

## Base de datos

| Entorno | Motor | Config |
|---------|-------|--------|
| Desarrollo (ejemplo) | SQLite | `.env.example` `DB_CONNECTION=sqlite` |
| Laragon / producción típica | **MySQL** | `DB_*` en `.env` |
| Control escolar externo | MySQL otra BD | `CONTROL_ESCOLAR_*` |
| Legacy certificados | Informix | `INFORMIX_*`, `SICES_LEGACY_*` |

## Estructura de carpetas (resumen)

```
app/
  Http/Controllers/Api/V1/    # API activa
  Http/Resources/               # JSON de respuesta
  Models/                       # Eloquent
  Services/                     # Lógica de negocio
  Infrastructure/               # Since, Informix
  Policies/                     # Autorización modelo

database/
  migrations/                   # 72 migraciones
  seeders/                      # Roles, menús, catálogos

resources/js/
  router.jsx                    # Rutas SPA
  pages/                        # Pantallas por módulo
  components/                   # UI reutilizable
  api/                          # Clientes REST
  hooks/                        # Bandejas, métricas
  utils/                        # Permisos, rutas por rol

routes/
  api.php                       # ~100 endpoints
  web.php                       # Catch-all SPA

tests/Feature/                  # Pruebas integración
docs/sices-v2/                  # Esta documentación
```

## Build y desarrollo

```bash
# Backend
composer install
php artisan migrate
php artisan db:seed

# Frontend
npm install
npm run dev      # Vite HMR
npm run build    # public/build/

# Todo junto (composer script)
composer run dev   # serve + queue + pail + vite
```

## Siguiente lectura

- [02 - Backend, API y modelos](./02-backend-api-modelos.md)
- [03 - Frontend React](./03-frontend-react.md)
