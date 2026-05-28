# 03 — Frontend React

## Entrada de la aplicación

```
resources/js/app.js
  → app.jsx (React root)
    → router.jsx (createBrowserRouter)
      → layouts (Guest / Private / Certificacion)
        → pages/*.jsx
```

**Axios:** `bootstrap.js` — `baseURL: '/api/v1'`, interceptor Bearer, 401 → logout.

**Sesión:** `authStore.js` — `localStorage`: `sices_token`, `sices_user`.

## Layouts principales

| Layout | Archivo | Cuándo |
|--------|---------|--------|
| `AuthLayout` | `layouts/AuthLayout.jsx` | `/login` |
| `AppLayout` | `layouts/AppLayout.jsx` | Todo `/app/*` (sidebar + topbar) |
| `CertificacionLayout` | `layouts/CertificacionLayout.jsx` | `/app/certificacion/*` (solo RC/admin) |

**Sidebar activo:** `SidebarPro.jsx` — carga menús desde API.

**Legacy sin uso:** `Sidebar.jsx` (no importado).

### Shell Educación Superior

Rutas `/app/educacion-superior/*` usan clase `admin-layout--es`:

- Sin breadcrumb duplicado de AppLayout
- Contenido en `EsPageLayout` + `esTheme.js`

## Router — grupos de rutas

Ver `resources/js/router.jsx`. Resumen:

| Prefijo | Páginas |
|---------|---------|
| `/app/dashboard` | Dispatcher por rol |
| `/app/certificacion/*` | Módulo RC (layout propio) |
| `/app/educacion-superior/*` | ES, UPN, revisión |
| `/app/control-escolar/*` | 13 páginas CE |
| `/app/direccion/*` | Supervisión dirección |
| `/app/documentos/*` | Wizard, bandejas, validación |
| `/app/sistemas/*` | Proceso técnico, logs |
| `/app/admin/*` | Usuarios, menús, catálogos |

**Guards:** componente `Guard` + `RequirePermission` con arrays de permisos (`PERM` en router).

**Rutas ES vs RC para revisión:**

- RC: `/app/certificacion/revision`
- ES: `/app/educacion-superior/revision`  
  Helper: `utils/certificacionRoutes.js`

## Módulos de páginas (`resources/js/pages/`)

| Carpeta | Estado |
|---------|--------|
| `educacionSuperior/` | Activo (instituciones, UPN, supervisión) |
| `certificacion/` | Activo (RC) |
| `controlEscolar/` | Activo |
| `documentos/` | Activo (bandejas, revisión institucional) |
| `dashboard/` | 14 dashboards por rol |
| `sistemas/` | Parcial (algunas páginas sin router) |
| `admision/` | **8 páginas sin rutas** (WIP) |

## Componentes por design system

| Sistema | Carpeta / tema | Uso |
|---------|----------------|-----|
| Institucional genérico | `components/ui/` + `inst-*` CSS | Bandejas, formularios legacy |
| Certificación RC | `components/certificacion/` + `certificacion.css` | Módulo `/app/certificacion` |
| Educación Superior | `components/educacionSuperior/` + `esTheme.js` | ES y UPN |
| Control escolar | `components/controlEscolar/` + `ceTheme.js` | CE |
| UPN | `components/upn/` | Certificación UPN |

**Duplicación:** `components/FormField.jsx` vs `components/ui/FormField.jsx` (mismo propósito).

## Clientes API (`resources/js/api/`)

| Archivo | Dominio |
|---------|---------|
| `bandejas.js` | `bandejasApi.listar(bandeja, params)` |
| `documentosAcademicos.js` | CRUD documento, aprobar, rechazar, liberar |
| `catalogos.js` | Instituciones, sedes, programas, subsistemas |
| `educacionSuperior.js` | Métricas ES |
| `auth.js` | Login/logout/me |
| `menus.js` | Admin menús / me menus |
| `decNormal.js`, `sicesLegacy.js` | Técnico / legacy |

## Hooks

| Hook | Pantalla |
|------|----------|
| `useCertificacionSupervision` | `EsCertificacionPage` — varias bandejas + KPIs |
| `useUpnCertificacionBandeja` | `UpnCertificacionPage` — UPN con timeout |
| `useCertificacionBandeja` | Solicitudes RC |
| `useDebouncedValue` | Búsquedas sin saturar API |
| `useEducacionSuperiorMetricas` | Caché 90s métricas |

## Permisos en UI

**Siempre usar** `user.permissions[]`:

```javascript
import { userCanAny } from '../utils/userPermissions';
import { upnCan } from '../utils/upnCertificacionPermissions';
import { esCan } from '../utils/esCertificacionPermissions';
```

Archivos de reglas: `certificacionPermissions.js`, `upnCertificacionPermissions.js`, `revisionInstitucionalPermissions.js`.

## Estilos

| Archivo | Alcance |
|---------|---------|
| `resources/css/app.css` | Tailwind 4 |
| `styles/sices-ui.css` | Variables globales, login |
| `styles/sices-institucional.css` | Admin, bandejas, ES shell |
| `styles/certificacion.css` | Sidebar RC |

**Tema remoto:** `theme/SicesThemeProvider.jsx` — colores/logo desde API apariencia.

## Build

```bash
npm run build
# Salida: public/build/manifest.json + chunks
```

Chunks manuales: `react-vendor`, `http-vendor`, `app`.

## Siguiente lectura

- [07 - UX/UI y redundancias](./07-ux-ui-redundancias.md)
- [05 - Matriz de roles y menús](./05-roles-menus-matriz.md)
- `resources/js/README_FRONTEND.md` (parcial, puede estar desactualizado)
