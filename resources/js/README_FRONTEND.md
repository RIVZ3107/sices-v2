# SICES v2 Frontend (API-first)

## Arquitectura
- Backend/API: Laravel (`/api/v1`).
- Frontend: React + Router + Axios.
- Blade solo para `welcome` y contenedor SPA (`app`).

## Rutas frontend implementadas
- `/login`
- `/app/dashboard`
- `/app/documentos/bandejas`
- `/app/documentos/bandejas/:bandeja`
- `/app/documentos/nuevo`
- `/app/documentos/:id/captura`
- `/app/documentos/:id`
- `/app/documentos/:id/validacion`
- `/app/documentos/:id/observaciones`
- `/app/documentos/validacion`
- `/app/documentos/observaciones`
- `/app/alumnos`
- `/app/alumnos/crear`
- `/app/matriculas`
- `/app/materias-cursadas`
- `/app/trayectorias`
- `/app/importaciones`
- `/app/sistemas/dashboard`
- `/app/sistemas/listos-para-firma`
- `/app/sistemas/logs`
- `/app/sistemas/configuracion`

## Endpoints consumidos
- Auth:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/logout`
- Catalogos:
  - `GET /api/v1/certificacion/catalogos/*`
- Alumnos:
  - `POST /api/v1/certificacion/alumnos`
  - `GET /api/v1/certificacion/alumnos/{id}`
  - `PUT /api/v1/certificacion/alumnos/{id}`
  - `GET /api/v1/certificacion/alumnos` (si backend lo expone)
- Matriculas:
  - `POST /api/v1/certificacion/matriculas`
  - `GET /api/v1/certificacion/matriculas/{id}`
  - `GET /api/v1/certificacion/matriculas` (si backend lo expone)
- Materias cursadas:
  - `POST /api/v1/certificacion/materias-cursadas`
  - `GET/PUT/DELETE/carga-masiva` de materias (si backend lo expone)
- Trayectorias:
  - `PUT /api/v1/certificacion/trayectorias-academicas`
  - `GET /api/v1/certificacion/matriculas/{id}/trayectoria` (si backend lo expone)
  - `POST /api/v1/certificacion/matriculas/{id}/trayectoria/recalcular` (si backend lo expone)
- Documentos:
  - `POST /api/v1/certificacion/documentos-academicos`
  - `GET /api/v1/certificacion/documentos-academicos/{id}`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/validar`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/enviar-revision`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/aprobar`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/rechazar`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/listo-para-firma`
- Observaciones:
  - `GET /api/v1/certificacion/documentos-academicos/{id}/observaciones`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/observaciones`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/observaciones/{obs}/atender`
  - `POST /api/v1/certificacion/documentos-academicos/{id}/devolver-correccion`
- Bandejas:
  - `GET /api/v1/certificacion/bandejas/documentos-academicos/*`
- Importaciones academicas:
  - `GET/POST /api/v1/academico/importaciones*` (si backend lo expone)

## Roles en UI

### Roles operativos principales
- `superadmin`
- `admin`
- `control_escolar_escuela`
- `director_escuela`
- `educacion_superior`
- `sistemas`

### Roles futuros o secundarios
- `docente` (modulo en preparacion)
- `coordinador_academico` (modulo en preparacion)
- `auditor` (solo lectura)
- `consulta` (solo lectura)

## Matriz de navegacion por rol

- `superadmin`
  - Ve: panel institucional, documentos, usuarios y roles, catalogos, parametros, reportes, auditoria, panel tecnico.
  - No ve: acciones de firma real.
- `admin`
  - Ve: panel administrativo, documentos, importaciones, usuarios y roles, catalogos, parametros, reportes.
  - No ve: modulos tecnicos de firma avanzada para operacion diaria.
- `control_escolar_escuela`
  - Ve: captura academica completa (alumnos, matriculas, materias, trayectorias), wizard documental, bandejas de seguimiento, importaciones.
  - No ve: configuracion tecnica ni acciones de firma.
- `director_escuela`
  - Ve: seguimiento institucional de documentos (por enviar, revision, aprobados, rechazados).
  - No ve: captura academica detallada ni configuracion tecnica.
- `educacion_superior`
  - Ve: revision institucional, validacion academica, pendientes, observados, aprobados y listos para firma.
  - No ve: firma real ni configuracion de integraciones tecnicas.
- `sistemas`
  - Ve: panel tecnico, listos para firma, firmados, errores, pendientes tecnicos, logs y configuracion tecnica informativa.
  - No ve: captura academica de alumnos/matriculas/materias.
- `auditor` (solo lectura)
  - Ve: panel de auditoria, consulta documental y logs.
  - No ve: acciones de captura, aprobacion, rechazo o preparacion de firma.
- `consulta` (solo lectura)
  - Ve: panel de consulta y consulta documental.
  - No ve: acciones de editar, aprobar, rechazar o preparar firma.
- `docente` (futuro)
  - Ve: panel institucional de modulo en preparacion para expansion.
  - No ve: acciones operativas del flujo de certificacion.
- `coordinador_academico` (futuro)
  - Ve: panel institucional de modulo en preparacion para expansion.
  - No ve: acciones operativas del flujo de certificacion.

## Manejo de errores global
- `401`: limpia sesion y redirige a `/login`.
- `403`: "No tienes permisos para realizar esta accion."
- `422`: errores de validacion por campo.
- `500`: "Ocurrio un error inesperado. Intenta nuevamente o contacta a soporte."

## Modulos con backend parcial o pendiente
- Listados globales de alumnos/matriculas/materias/trayectoria: la UI funciona con mensajes institucionales cuando falta endpoint.
- Importaciones academicas: pantalla operativa con aviso institucional cuando backend no esta activo.
- Logs tecnicos: mensaje institucional hasta habilitar integracion.
- Configuracion tecnica: solo lectura, sin llaves ni parametros de firma real.

## Confirmacion de alcance
- No se implementa firma real SEP.
- No se invoca since-service.
- No se toca Jasper.
- No se genera PDF oficial.
