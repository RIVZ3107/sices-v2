# Diagnóstico técnico RBAC — SICES v2

**Fecha de análisis:** mayo 2026  
**Alcance:** roles, permisos, rutas, menús y flujo de certificación electrónica SEP.

**Archivos revisados prioritariamente:**

- `database/seeders/RolesAndPermissionsSeeder.php`
- `database/seeders/MenuSeeder.php` → `SystemMenusSeeder.php`
- `database/seeders/DatabaseSeeder.php`
- `database/seeders/Support/SicesPermissionsCatalog.php`
- `config/permission.php`
- `app/Models/User.php`, `app/Models/Menu.php`
- `routes/web.php`, `routes/api.php`
- `resources/js/layouts/SidebarPro.jsx` (no existe `Sidebar.jsx`)
- `resources/js/router.jsx`
- `resources/js/pages/dashboard/DashboardPage.jsx` (equivalente a “dashboard por rol”; no existe `DashboardContent.jsx`)
- `app/Http/Controllers/Api/V1/Certificacion/*`
- `app/Services/Certificacion/*`
- `app/Policies/*`
- Policies: `DocumentoAcademicoPolicy`, `AlumnoPolicy`, `MatriculaPolicy`, `ConfiguracionVisualSistemaPolicy`

**Arquitectura RBAC:** Spatie Laravel Permission (`guard: web`), menús en BD (`permission_name` + `menu_role`), API con `auth:sanctum` + middleware `permission` / `permission_or` + policies Laravel. Catálogo dual **legacy** + **modular** en `SicesPermissionsCatalog`.

---

## 1. Roles reales encontrados

| Nombre técnico | Nombre visual (UI/menús) | Propósito actual | Archivos donde aparece |
|---|---|---|---|
| `superadmin` | Superadmin / Inicio | Acceso total; todos los permisos | `RolesAndPermissionsSeeder`, `SystemMenusSeeder`, `DashboardPage.jsx`, `CertificacionAlcanceService`, tests |
| `admin` | Administración / Inicio | Igual que superadmin en permisos (sync de todos) | Mismo set + menús `sa_*` |
| `sistemas` | Dashboard técnico / Sistemas | Operación técnica: XML, cadena, firma, logs, jobs, menús, apariencia; sin matrícula ni aprobación académica | `SicesPermissionsCatalog`, menús `sys_*`, `SistemasDashboardPage`, `DocumentoAcademicoPolicy`, tests |
| `educacion_superior` | Educación Superior | Autoridad central Normal/UPN: instituciones, solicitudes matrícula, validación normativa, liberación a proceso técnico | Menús `es_*`, `Es*Page`, `forbiddenForEducacionSuperior`, tests |
| `director_escuela` | Dirección de escuela | Supervisión institucional: alumnos, inscripciones, aprobación/rechazo documental institucional | Menús `dir_*`, `Direccion*Page`, `ActionResolver`, tests |
| `control_escolar_escuela` | Control Escolar | Operación escuela: captura alumnos, calificaciones, borradores documentales, envío a revisión | Menús `ce_*`, `*CePage`, legacy CE, tests |
| `responsable_admision` | Admisión | Solo flujo de ingreso (convocatorias, aspirantes, evaluación, resultados) | Menús `ra_*`, `Admision*Page`, tests Admisión |
| `responsable_evaluacion` | Evaluación / coordinación | Grupos, calificaciones, actas, correcciones | Menús `rev_*` → `/app/coordinador/dashboard` |
| `responsable_certificacion_titulacion` | Certificación y titulación | Bandejas documentales, folios, consulta pública; sin permisos técnicos de generación/firma | Menús `rc_*`, `ResponsableCertificacionDashboardPage`, tests |
| `docente` | Docente | Captura propia de calificaciones y actas | Menús `doc_*`, `DocenteDashboardPage`, tests |
| `auditor` | Auditoría / consulta | Lectura expedientes, documentos, auditoría, logs lectura | Menús `au_*`, tests |
| `alumno_egresado` | Portal alumno | Expediente y documentos propios | Menús `al_*`, tests |
| `aspirante_preinscrito` | Portal aspirante | Registro y estado de admisión propio | Menús `as_*`, tests |
| `consulta` | Consulta | Solo lectura de documentos | Menús `con_*`, `DocumentoAcademicoPolicy` |
| `coordinador_academico` | Coordinación académica | Panel coordinador (parcial, sin seed legacy) | Menús `coor_*` |

**Nota:** 15 roles en seeder; tests documentan 12 “base” (excluyen `admin`, `consulta`, `coordinador_academico`).

---

## 2. Permisos reales encontrados

### 2.1 Modelo de catálogo

- **Legacy (~65):** usados en rutas, policies y `ActionResolver` (`ver_documentos`, `generar_cadena`, `generar_xml`, `asignar_matricula`, etc.).
- **Modular por rol:** lista explícita en `modularPermissionsByRole()` (~15–40 por rol operativo).
- **Cartesiano `dominio.acción`:** miles de permisos registrados en BD; la mayoría **no se asignan** a roles operativos (solo `superadmin`/`admin` reciben todos).

### 2.2 Permisos críticos de certificación

| Permiso | Módulo | Roles que lo tienen | ¿Usado? |
|---|---|---|---|
| `crear_documentos` / `documentos.crear_borrador` | Documentos | CE, admin, superadmin | Sí — policy `create`, API `store` |
| `enviar_revision` / `documentos.enviar_revision` | Documentos | CE, admin, superadmin | Sí — policy `enviarRevision` |
| `aprobar_documentos` / `documentos.aprobar_institucionalmente` | Documentos | director, admin, superadmin (+ paridad) | Sí — policy `aprobar` |
| `documentos.validar_normativamente` | Documentos | educacion_superior | Sí — `ActionResolver` |
| `documentos.liberar_proceso_tecnico` | Certificación | educacion_superior | Sí — policy `marcarListoParaFirma` |
| `preparar_documento_firma` | Firma prep. | sistemas (legacy) | Sí — policy folio/token/listo firma |
| `generar_cadena` / `cadena_original.generar` | Cadena | sistemas, admin, superadmin | Sí — `DocumentoDecNormalController` |
| `generar_xml` / `xml.generar` | XML | sistemas, admin, superadmin | Sí — mismo controlador |
| `ver_xml` / `xml.ver` | XML | sistemas, responsable_cert (ver), admin | Sí — endpoint `errores` |
| `solicitar_firma` | Firma SEP | **Ningún rol operativo** (solo admin/superadmin por “todos”) | Catálogo + `ActionResolver`; **no asignado a sistemas** |
| `firma.ejecutar` | Firma | sistemas (modular) | Parcial — no alineado con `solicitar_firma` |
| `generar_pdf` / `pdf.generar` | PDF | sistemas, admin, superadmin | Parcial — jobs/servicios; sin ruta API dedicada |
| `consulta_publica.ver` | Consulta pública | educacion_superior, responsable_cert | Menú sí; API token sí; controlador público vacío |
| `ver_auditoria` / `auditoria.ver` | Auditoría | sistemas, auditor, admin | Menú/logs; `AuditoriaService` en servicios |
| `matriculas.asignar` / `asignar_matricula` | Matrículas | educacion_superior, admin, superadmin | Sí — middleware ruta API |

### 2.3 Permisos huérfanos o poco usados

- Miles de `dominio.acción` del grid cartesiano: registrados, no asignados.
- `solicitar_firma`, `reintentar_firma`, `gestionar_firmantes`: no en asignación por rol.
- `responsable_evaluacion`: menú exige `dashboard.ver` pero el rol **no** lo recibe en seeder.

---

## 3. Rutas protegidas

### 3.1 Web (`routes/web.php`)

| Método | Ruta | Controlador | Middleware | Rol/permiso | Riesgo |
|---|---|---|---|---|---|
| GET | `/`, `/login`, `/app/*` | SPA `app` | Ninguno | Token en cliente | **Alto** — autorización en front |

### 3.2 API — certificación (bloque sensible)

| Método | Ruta | Middleware ruta | Autorización efectiva | Riesgo |
|---|---|---|---|---|
| POST | `v1/certificacion/documentos-academicos` | Solo `auth:sanctum` | Policy `create` | **Alto** |
| POST | `.../aprobar`, `rechazar`, `enviar-revision`, etc. | Solo `auth:sanctum` | Policies | **Alto** |
| POST | `.../dec-normal/cadena`, `xml` | Solo `auth:sanctum` | `view` + `can(generar_cadena/generar_xml)` | Medio |
| POST | `.../token-consulta-publica` | Solo `auth:sanctum` | Policy `emitirTokenConsultaPublica` | Medio |
| GET | `.../bandejas/*` | `permission_or:ver_documentos\|documentos.ver` | + alcance territorial | Bajo |

### 3.3 Defectos en rutas

| Problema | Riesgo |
|---|---|
| `ControlEscolarController` referenciado en `api.php` **sin import** | **Crítico** |
| `DocumentoFirmaController`, `ConsultaPublicaController` vacíos, sin rutas | **Alto** |
| `v1/sistema/apariencia/*` solo Sanctum | Medio |

---

## 4. Menús por rol

Fuente: `SystemMenusSeeder` + `UserMenuService` + `SidebarPro` (API `GET v1/me/menus`).

| Rol | Módulos visibles | Rutas clave | Permiso menú | Problemas |
|---|---|---|---|---|
| superadmin / admin | Inicio, estructura, usuarios, roles, menús, apariencia, auditoría, técnico | `/app/admin/*`, `/app/sistemas/*` | Variados | SPA admin sin `RequirePermission` |
| sistemas | Dashboard, usuarios, roles, catálogos, integraciones, logs, jobs, listos para firma | `/app/sistemas/*` | `logs.ver`, `firma.ver`, etc. | Coherente |
| educacion_superior | Instituciones, solicitudes, validaciones, certificación, consulta pública | `/app/educacion-superior/*` | `certificacion.ver`, etc. | Sin menú directo a bandejas documentales |
| director_escuela | Indicadores, alumnos, inscripciones, documentos, autorizaciones | `/app/direccion/*` | Supervisión | `/app/expedientes` sin guard en router |
| control_escolar_escuela | Alumnos, trayectoria, calificaciones, documentos, importaciones | `/app/control-escolar/*` | Operación | `ce_baj` usa `expedientes.editar`; `ce_sol` usa `expedientes.ver` |
| responsable_admision | Solo admisión | `/app/admision/*` | `admision.*` | OK + `RequirePermission` |
| responsable_evaluacion | Grupos, calificaciones, actas | `/app/coordinador/dashboard` | **`dashboard.ver` sin permiso** | Menú Inicio roto |
| responsable_certificacion | Validación, bandejas, folios, consulta pública | `/app/documentos/bandejas/*` | `certificacion.ver`, `documentos.ver` | Rutas sin `RequirePermission` |
| docente / alumno / aspirante | Portales | dashboard propio | `portal.ver`, `admision.portal` | OK |
| auditor | Expedientes, auditoría, logs lectura | `/app/auditoria` | `auditoria.ver` | OK |
| consulta | Documentos | `/app/consulta/*` | `documentos.ver` | OK |

---

## 5. Flujo de certificación actual

| Etapa | Quién (diseño) | Mecanismo | Brecha |
|---|---|---|---|
| Captura académica | `control_escolar_escuela` | `crear_documentos`, wizard | OK |
| Revisión | `director_escuela`, `educacion_superior` | `enviar_revision`, bandejas | Front `DocumentoShowPage` ignora varios roles |
| Aprobación | director, educación superior | Policy `aprobar` | **responsable_cert** sin `aprobar_*` ni `autorizar_emision` |
| Cadena original | `sistemas` | `generar_cadena` | ES/responsable_cert solo lectura — OK |
| XML | `sistemas` | `generar_xml`, `validarXml` | OK |
| Sello local | Servicios (`OpenSslSelloService`) | Sin endpoint HTTP | No expuesto |
| Firma SEP/SINCE | `sistemas` (diseño) | `FirmarDocumentoAcademicoService` | **`solicitar_firma` no asignado a sistemas**; controller vacío |
| PDF oficial | `sistemas` | Jobs/servicios | Sin ruta API |
| Consulta pública | ES, responsable_cert | `emitirTokenConsultaPublica` | `ConsultaPublicaController` vacío |
| Auditoría/logs | sistemas, auditor | `AuditoriaService` | ES sin `auditoria.ver` por diseño |

**Liberación a proceso técnico:** requiere `documentos.liberar_proceso_tecnico` — solo **educacion_superior** en seeder; no **responsable_certificacion**.

---

## 6. Riesgos

### Crítico

1. Rutas `documentos-academicos` sin middleware de permiso (solo policies).
2. `ControlEscolarController` no importado en `routes/api.php`.
3. `solicitar_firma` no asignado a `sistemas` pero exigido por `ActionResolver`.
4. Desalineación **responsable_certificacion**: menús vs permisos API.

### Alto

5. SPA: `/app/documentos/*`, control escolar, dirección, expedientes sin `RequirePermission`.
6. Controladores de firma y consulta pública vacíos.
7. `DocumentoShowPage` usa `roles[0]` y lista fija de roles.
8. Catálogo cartesiano con miles de permisos sin uso.

### Medio

9. Duplicidad legacy/modular.
10. `responsable_evaluacion` sin `dashboard.ver`.
11. Observaciones institucionales solo `educacion_superior` en controller.
12. Rol `admin` con todos los permisos.

### Bajo

13. `RoleMenuSeeder` fue retirado; usar solo `SystemMenusSeeder`.
14. Tests sin cobertura de rutas documento/firma/XML por rol.
15. `RequirePermission` sin soporte OR.

---

## 7. Matriz propuesta corregida

Leyenda: **S** = operar, **V** = ver, **—** = no.

| Rol | Alumnos | Matrículas | Materias | Trayectorias | Docs captura | Cadena | XML | Sello | Firma SEP | PDF | Consulta pública | Auditoría | Config técnica |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| control_escolar_escuela | S | V | S | S | S | — | — | — | — | — | — | V | — |
| director_escuela | V | V | V | V | V / aprobar inst. | — | — | — | — | — | — | V | — |
| educacion_superior | V | S | V | V | V / normativa | — | — | — | — | — | S | V | — |
| responsable_certificacion | V | V | V | V | V / validar* | V | V | — | — | V | S | V | — |
| sistemas | V | — | — | V | V técnico | S | S | S** | S*** | S | V | S | S |
| responsable_admision | V† | — | — | — | — | — | — | — | — | — | — | — | — |
| docente | V‡ | — | S propias | — | — | — | — | — | — | — | — | — | — |
| auditor | V | V | V | V | V | — | — | — | — | — | V | S | — |
| admin / superadmin | S | S | S | S | S | S | S | S | S | S | S | S | S |

\* Asignar permisos de validación/liberación en seeder.  
\** Servicios internos; falta API.  
\*** Tras asignar `solicitar_firma` o alinear con `firma.ejecutar`.  
† Solo aspirantes. ‡ Solo grupo propio.

**No se recomienda rol nuevo** si se corrigen permisos de `sistemas` y `responsable_certificacion_titulacion`.

---

## 8. Cambios recomendados

### Urgentes

1. Importar `ControlEscolarController` en `routes/api.php`.
2. Asignar `solicitar_firma` a `sistemas` o cambiar `ActionResolver` a `firma.ejecutar`.
3. Completar permisos de `responsable_certificacion_titulacion` (liberar técnico, preparar firma, validar/aprobar acotado).
4. Middleware `permission_or` en POST de documentos-academicos.
5. `RequirePermission` con OR en rutas SPA críticas.

### Recomendados

6. Implementar `DocumentoFirmaController` y `ConsultaPublicaController`.
7. Añadir `dashboard.ver` a `responsable_evaluacion`.
8. Unificar `DocumentoShowPage` con `permissions[]` del usuario.
9. Reducir catálogo cartesiano a permisos usados.
10. Tests Feature por rol (cadena, XML, firma, aprobar).

### Mejoras futuras

11. Teams Spatie para alcance territorial.
12. Gates por acción de negocio.
13. Auditoría obligatoria en firma SEP y regeneración PDF.
14. Migración completa legacy → modular.

---

## 9. Código sugerido (referencia)

### `SicesPermissionsCatalog` — permisos a añadir

```php
// modularPermissionsByRole['sistemas']:
'solicitar_firma',
'reintentar_firma',

// modularPermissionsByRole['responsable_certificacion_titulacion']:
'documentos.liberar_proceso_tecnico',
'preparar_documento_firma',
'certificacion.autorizar_emision', // si debe aprobar emisión

// modularPermissionsByRole['responsable_evaluacion']:
'dashboard.ver',

// Parity opcional:
// 'solicitar_firma' => ['firma.ejecutar'],
```

### `routes/api.php`

```php
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarController;

Route::post('documentos-academicos', [DocumentoAcademicoProcesoController::class, 'store'])
    ->middleware('permission_or:crear_documentos|documentos.crear|documentos.crear_borrador');
```

### `DocumentoAcademicoPolicy::aprobar`

```php
return (
    SicesAuth::canAny($user, 'aprobar_documentos', 'documentos.aprobar', 'documentos.aprobar_institucionalmente')
    || $user->can('validaciones_normativas.aprobar')
    || $user->can('certificacion.autorizar_emision')
    || $user->can('certificacion.validar')
) && $this->alcance->documentoEnAlcance($user, $documento);
```

### `ActionResolver`

```php
'ejecutar_firma_tecnica' => [
    'permission_required' => 'firma.ejecutar', // o solicitar_firma según política unificada
],
```

### `RequirePermission.jsx` — soporte OR

```jsx
export function RequirePermission({ permission, anyOf = [], children }) {
    const perms = getUser()?.permissions ?? [];
    const ok = permission ? perms.includes(permission)
        : anyOf.some((p) => perms.includes(p));
    if (!ok) return <Navigate to="/app/dashboard" replace />;
    return children;
}
```

---

## Resumen ejecutivo

RBAC bien estructurado en seeders y menús, con separación CE / Dirección / Educación Superior / Sistemas / Admisión. El flujo de certificación electrónica está **a medias en API**: workflow protegido por policies (no middleware), firma SEP y consulta pública sin controladores, y desfases entre `responsable_certificacion_titulacion`, `sistemas` (`solicitar_firma`) y el frontend de documentos.

**Prioridad:** cerrar permisos–rutas–UI para que cada rol del flujo SEP ejecute solo lo definido por negocio, sin depender de `admin`/`superadmin`.

---

*Documento generado a partir de análisis de código. No modifica reglas de negocio ni archivos del repositorio.*
