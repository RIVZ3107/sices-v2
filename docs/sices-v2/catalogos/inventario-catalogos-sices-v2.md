# Inventario de catálogos — SICES v2

**Fecha:** 2026-06-04  
**Alcance:** Auditoría de catálogos necesarios para operación institucional (estructura académica, certificación, control escolar, seguridad).  
**Estado de datos (diagnóstico base):** Demo activo 0. Catálogos académicos importados y validados.

| Entidad | Registros |
|---------|-----------|
| subsistemas | 2 |
| regiones | 3 |
| instituciones | 14 |
| sedes | 18 |
| entidades_federativas | 32 |
| municipios | 125 |
| niveles_academicos | 5 |
| programas_estudio | 36 |
| planes_estudio | 31 |
| materias | 1 054 |
| plan_materias | 1 153 |
| ofertas_academicas | 86 |
| ciclos_escolares | 0 |

---

## Leyenda de columnas

| Columna | Significado |
|---------|-------------|
| **Tabla** | Existe migración/tabla física en MySQL |
| **Modelo** | Existe modelo Eloquent o enum PHP de dominio |
| **Seeder** | Existe seeder que carga o documenta valores iniciales |
| **API** | Endpoint de solo lectura o consulta expuesto bajo `/api/v1` |
| **Pantalla** | Ruta SPA dedicada o visible en módulo funcional |
| **Pantalla propia** | ¿Debe tener pantalla independiente en menú? |
| **Módulo** | Agrupación de menú recomendada |
| **Prioridad** | Urgencia para operación institucional |

**Nota arquitectónica:** SICES v2 distingue tres capas de catálogo:

1. **Tabla catálogo** — entidad persistente editable (p. ej. `instituciones`).
2. **Enum/config** — valores fijos en PHP o columnas enum (p. ej. estados de firma).
3. **Operacional** — registros transaccionales que usan catálogos (p. ej. `folios`).

---

## A) Estructura académica

| Catálogo | Tabla | Modelo | Seeder | API | Pantalla | Pantalla propia | Módulo | Prioridad | Observaciones |
|----------|:-----:|:------:|:------:|:---:|:--------:|:---------------:|--------|:---------:|---------------|
| **subsistemas** | Sí | Sí (`Subsistema`) | Sí (`SubsistemasSeeder`) | Sí (`catalogos-academicos/subsistemas`, `certificacion/catalogos/subsistemas`) | Sí (`/app/catalogos/subsistemas-instituciones`) | No (integrado) | Estructura | Alta | 2 registros (UPN, NORMAL). Consulta funcional. |
| **regiones** | Sí | Sí (`Region`) | Parcial (`InstitucionesLegacyBaseSeeder` crea regiones base) | Parcial (`certificacion/catalogos/regiones`; en `catalogos-academicos/filtros`) | No | No | Estructura | Media | 3 registros. Solo filtro en instituciones; sin pantalla ni CRUD. |
| **instituciones** | Sí | Sí (`Institucion`) | Sí (`Catalogos/InstitucionesLegacyBaseSeeder`, importación SISEES) | Sí (`catalogos-academicos/instituciones`, detalle, sedes, ofertas) | Sí (tabs + subsistemas) | No (integrado) | Estructura | Alta | 14 registros importados. Núcleo del módulo ESTRUCTURA. |
| **sedes** | Sí | Sí (`Sede`) | Sí (`InstitucionesSedesInicialSeeder`, `InstitucionesSubsedesLegacySeeder`, importación) | Sí (`catalogos-academicos/sedes`, `certificacion/catalogos/sedes`, alias `catalogos/sedes`) | Sí (`/app/catalogos/sedes`) | Sí | Estructura | Alta | 18 registros. Pantalla dedicada operativa. |
| **entidades_federativas** | Sí | Sí (`EntidadFederativa`) | Sí (`EntidadFederativaSeeder`) | Parcial (vía `filtros` y `municipios`) | Parcial (columna en municipios) | No | Estructura | Media | 32 registros. Catálogo territorial de soporte. |
| **municipios** | Sí | Sí (`Municipio`) | Sí (`MunicipioSeeder`, importación) | Sí (`catalogos-academicos/municipios`) | Sí (`/app/catalogos/municipios`) | Sí | Estructura | Alta | 125 registros. Pantalla territorial operativa. |
| **niveles_academicos** | Sí | Sí (`NivelAcademico`) | Sí (`NivelAcademicoSeeder`) | Parcial (aparece en `resumen` y join de programas) | Parcial (columna en programas) | No | Estructura | Media | 5 registros base (LIC, MAE, etc.). Sin endpoint ni pantalla dedicados. |
| **programas_estudio** | Sí | Sí (`ProgramaEstudio`) | Importación SISEES | Sí (`catalogos-academicos/programas`) | Sí (tabs + programas-ofertas) | No (integrado) | Estructura | Alta | 36 registros importados. |
| **planes_estudio** | Sí | Sí (`PlanEstudio`) | Importación SISEES | Sí (`catalogos-academicos/planes`) | Sí (tabs + programas-ofertas) | No (integrado) | Estructura | Alta | 31 registros importados. |
| **materias** | Sí | Sí (`Materia`) | Importación SISEES | Sí (`catalogos-academicos/materias`) | Sí (tab en catálogos académicos) | No (integrado) | Estructura | Alta | 1 054 registros importados. |
| **plan_materias** | Sí | Sí (`PlanMateria`) | Importación SISEES | Sí (`catalogos-academicos/planes/{id}/materias`) | Sí (estructura curricular) | No (integrado) | Estructura | Alta | 1 153 registros. Vista “Estructura curricular”. |
| **ofertas_academicas** | Sí | Sí (`OfertaAcademica`) | Importación SISEES | Sí (`catalogos-academicos/ofertas-academicas`) | Sí (tabs + programas-ofertas) | No (integrado) | Estructura | Alta | 86 registros. Incluye modalidad como columna enum. |
| **modalidades** | No | Enum implícito | No | No | Parcial (columna en ofertas) | No | Estructura | Media | Valores: `escolarizada`, `mixta`, `no_escolarizada`. En legacy SISEES existía tabla `modalidad`; en v2 es enum en `ofertas_academicas`. No requiere pantalla; eventual catálogo si SEP exige más valores. |
| **turnos** | No | No | No | No | No | No | Control escolar | Baja | En legacy SISEES tabla `turno`; en v2 columna `turno` (string) en `grupos`. Sin datos ni pantalla. Pendiente cuando exista operación de grupos. |
| **ciclos_escolares** | Sí | Sí (`CicloEscolar`) | No dedicado | Sí (`certificacion/catalogos/ciclos-escolares`) | No | Sí (futuro) | Control escolar | Alta | **0 registros.** Tabla y API de captura existen; falta carga institucional e integración en menú Estructura o Control escolar. |

### Catálogos académicos relacionados (fuera de lista explícita, detectados en migraciones)

| Catálogo | Tabla | Modelo | API | Pantalla | Observaciones |
|----------|:-----:|:------:|:---:|:--------:|---------------|
| periodos_escolares | Sí | Sí | No | No | Soporte a inscripciones/grupos; sin API catálogo |
| grupos | Sí | Sí | No | No | Operacional; turno como string |
| generaciones | Sí | Sí | No | No | Operacional |

---

## B) Certificación / documentos

| Catálogo | Tabla | Modelo | Seeder | API | Pantalla | Pantalla propia | Módulo | Prioridad | Observaciones |
|----------|:-----:|:------:|:------:|:---:|:--------:|:---------------:|--------|:---------:|---------------|
| **tipos_documento** | No | Sí (`TipoDocumentoAcademico` enum) | Sí (`TipoDocumentoSeeder` — documentación) | Sí (`catalogos/documentos-academicos/tipos`) | Parcial (formularios certificación) | No | Certificación | Alta | Valores: certificado, título, grado. Enum + servicio; no tabla catálogo. |
| **tipos_certificacion** | No | Sí (`TipoCertificacion` enum) | Sí (`TipoCertificacionSeeder`) | No | Parcial (flujos documento) | No | Certificación | Media | Enum en `documentos_academicos`; uso interno en motor documental. |
| **estados_documento** | No | Sí (`EstadoWorkflow` enum) | Sí (`EstadoCatalogoSeeder`) | No | Parcial (bandejas, detalle documento) | No | Certificación | Alta | Columna `estado_workflow` en `documentos_academicos`. Estados fijos; no requiere pantalla catálogo. |
| **estados_cadena** | No | Sí (`EstadoCadena` enum) | Sí (`EstadoCatalogoSeeder`) | No | Parcial (proceso técnico) | No | Sistema | Media | Columna `estado_cadena`. Solo uso interno / perfil sistemas. |
| **estados_xml** | No | Sí (`EstadoXml` enum) | Sí (`EstadoCatalogoSeeder`) | No | Parcial (proceso técnico) | No | Sistema | Media | Columna `estado_xml`. |
| **estados_firma** | No | Sí (`EstadoFirma` enum) | Sí (`EstadoCatalogoSeeder`) | No | Parcial (proceso técnico) | No | Sistema | Media | Columna `estado_firma`. |
| **estados_pdf** | No | Sí (`EstadoPdf` enum) | Sí (`EstadoCatalogoSeeder`) | No | Parcial (proceso técnico) | No | Sistema | Media | Columna `estado_pdf`. |
| **proveedores_firma** | No | Sí (`ProveedorFirma` enum) | Sí (`ProveedorFirmaSeeder`) | No | Parcial (`ParametrosSistemaPage`, proceso técnico) | No | Sistema | Media | Enum + registros en `firma_configuraciones`. Configuración técnica, no catálogo usuario. |
| **reglas_cadena_original** | Sí | Sí (`CadenaOriginalRegla`) | Sí (`CadenaOriginalReglaSeeder`) | No | No | No | Sistema | Alta | Tabla técnica. Sin API de consulta institucional; administración vía sistemas/seeders. |
| **plantillas_xml** | Sí | Sí (`XmlPlantilla`) | Sí (`XmlPlantillaSeeder`) | No | No | No | Sistema | Alta | Plantillas DEC/XML. Solo uso interno del motor. |
| **plantillas_documento** | Sí | Sí (`PlantillaDocumento`) | Sí (`PlantillaDocumentoSeeder`) | No | No | No | Sistema | Alta | Plantillas PDF/HTML. Solo uso interno. |
| **folios** | Sí | Sí (`Folio`) | No | No | No | No | Certificación | Media | Tabla operacional (asignación por documento). **0 registros.** No es catálogo navegable; es numeración transaccional. |
| **series_folio** | No | No | No | No | No | No | Certificación | Media | **Faltante como catálogo.** Serie modelada como `prefijo` + `numero` + `tipo_documento` + `ciclo_escolar_id` en `folios`. Evaluar catálogo de series si instituciones requieren múltiples prefijos configurables. |
| **motivos_rechazo** | No | No | No | No | Parcial (texto libre en solicitudes) | No | Control escolar | Media | **Faltante como catálogo.** Campo `motivo_rechazo` texto libre en `solicitudes_matricula` y workflow documental. Sin tabla ni lista institucional. |
| **motivos_cancelacion** | No | No | No | No | Parcial (metadata workflow) | No | Control escolar | Media | **Faltante como catálogo.** Valor en metadata de inscripciones (`motivo_cancelacion`); sin catálogo formal. |

### Entidades técnicas de certificación (soporte, no catálogo de menú)

| Entidad | Tabla | Seeder | Uso |
|---------|:-----:|:------:|-----|
| firma_configuraciones | Sí | `FirmaConfiguracionSeeder` | Config por subsistema/tipo documento |
| firmantes_autorizados | Sí | — | Catálogo operativo de firmantes |
| credenciales_firma | Sí | — | Credenciales técnicas |
| ventanas_operacion | Sí | — | Ventanas de timbrado/firma |

---

## C) Control escolar

| Catálogo | Tabla | Modelo | Seeder | API | Pantalla | Pantalla propia | Módulo | Prioridad | Observaciones |
|----------|:-----:|:------:|:------:|:---:|:--------:|:---------------:|--------|:---------:|---------------|
| **estatus_academico** | No | No | No | No | Parcial (expedientes) | No | Control escolar | Alta | **Faltante como catálogo.** Columna `estatus` en `alumnos` (string, default `activo`). Sin enum central ni pantalla. |
| **estatus_matricula** | No | No | No | No | Parcial (matrículas/expedientes) | No | Control escolar | Alta | **Faltante como catálogo.** Columna `estado` en `matriculas` (string, default `activa`). Lógica en servicios; sin tabla catálogo. |
| **tipos_inscripcion** | No | No | No | No | No | No | Control escolar | Media | **Faltante.** Resuelto en servicios (`ControlEscolarBajasCambiosService`) vía metadata; sin catálogo persistente. |
| **tipos_baja** | No | No | No | No | No | No | Control escolar | Media | **Faltante.** No hay tabla ni enum dedicado en migraciones actuales. |
| **motivos_baja** | No | No | No | No | No | No | Control escolar | Media | **Faltante.** Sin catálogo; requerido para bajas institucionalizadas. |
| **tipos_movimiento** | No | No | No | No | No | No | Control escolar | Baja | **Faltante.** Movimientos académicos aún no modelados como catálogo. |
| **periodos_inscripcion** | Parcial (`periodos_escolares`) | Sí (`PeriodoEscolar`) | No | No | No | Sí (futuro) | Control escolar | Alta | Tabla `periodos_escolares` existe; sin API catálogo ni pantalla. Relacionado con ventanas de inscripción. |
| **escalas_calificacion** | No | No | No | No | No | No | Control escolar | Alta | **Faltante.** Solo umbral en `config/certificacion.php` (`calificacion_aprobatoria_minima`). Sin tabla de escalas/equivalencias. |
| **tipos_carga_academica** | No | No | No | No | No | No | Control escolar | Media | Columna `estatus` en `cargas_academicas`; sin catálogo de tipos. **0 registros** operativos. |

---

## D) Seguridad y operación

| Catálogo | Tabla | Modelo | Seeder | API | Pantalla | Pantalla propia | Módulo | Prioridad | Observaciones |
|----------|:-----:|:------:|:------:|:---:|:--------:|:---------------:|--------|:---------:|---------------|
| **roles** | Sí (Spatie) | Sí (`Spatie\Permission\Models\Role`) | Sí (`RolesAndPermissionsSeeder`) | Sí (`admin/roles`) | Sí (`/app/admin/usuarios-roles`) | No (integrado) | Sistema | Alta | 15 roles. Pantalla combinada usuarios/roles. |
| **permisos** | Sí (Spatie) | Sí (`Spatie\Permission\Models\Permission`) | Sí (`RolesAndPermissionsSeeder`, `SicesPermissionsCatalog`) | Parcial (asignación en admin) | Sí (usuarios-roles) | No | Sistema | Alta | ~3 362 permisos granulares. |
| **menus** | Sí | Sí (`Menu`) | Sí (`SystemMenusSeeder`) | Sí (`admin/menus`, `user/menus`) | Sí (`/app/admin/menus`) | Sí | Sistema | Alta | 141 entradas. Administración por rol operativa. |
| **alcances_usuario** | Sí (`usuario_regiones`, `usuario_instituciones`, `usuario_sedes`) | Sí | No dedicado | Parcial (CRUD usuarios) | Parcial (usuarios-roles) | No | Sistema | Alta | Alcance territorial por usuario; sin pantalla catálogo independiente. |
| **tipos_usuario** | No | No (roles Spatie) | — | — | Parcial (roles) | No | Sistema | Baja | No hay tabla `tipos_usuario`; el rol Spatie cumple la función. |
| **estatus_usuario** | No | No | No | No | No | No | Sistema | Media | **Faltante.** Tabla `users` sin columna `activo`/`estatus`; gestión de baja lógica no formalizada como catálogo. |

---

## Resumen ejecutivo

### Catálogos existentes y operativos (consulta institucional)

| Área | Estado |
|------|--------|
| Estructura académica núcleo | **Consolidado** — instituciones, sedes, programas, planes, materias, plan_materias, ofertas, municipios, subsistemas |
| Hub de navegación | **Consolidado** — `/app/admin/catalogos` + menú ESTRUCTURA (5 rutas SPA) |
| API consulta académica | **Consolidado** — `/api/v1/catalogos-academicos/*` (15 endpoints GET) |
| Territorio | **Consolidado** — entidades + municipios con datos |
| Certificación (enums/config) | **Parcial** — enums y seeders técnicos; sin pantallas catálogo para usuario operativo |
| Control escolar (catálogos) | **Incompleto** — tablas transaccionales existen; catálogos de estatus/tipos faltan |
| Ciclos escolares | **Crítico** — tabla vacía; bloquea matrícula e inscripción real |

### Catálogos faltantes o no modelados como catálogo

**Prioridad alta**

1. `ciclos_escolares` — tabla sin datos (0 registros).
2. `escalas_calificacion` — no existe; solo constante config.
3. `estatus_academico` / `estatus_matricula` — strings libres sin catálogo central.
4. `periodos_inscripcion` — tabla `periodos_escolares` sin API/pantalla.

**Prioridad media**

5. `series_folio` — lógica embebida en `folios`, sin catálogo configurable.
6. `motivos_rechazo` / `motivos_cancelacion` / `motivos_baja` — texto libre o metadata.
7. `tipos_inscripcion`, `tipos_baja`, `tipos_carga_academica` — sin catálogo persistente.
8. `regiones`, `niveles_academicos` — existen como tabla pero sin pantalla/API dedicada.
9. `estatus_usuario` — sin formalización en `users`.

**Prioridad baja / diseño intencional**

10. `modalidades`, `turnos` — enum/columna suficiente por ahora.
11. Estados de certificación (workflow, xml, firma, pdf, cadena) — enums PHP; no requieren pantalla catálogo.
12. `tipos_usuario` — cubierto por roles Spatie.

### Duplicidad API detectada

| Dominio | Endpoints duplicados | Recomendación |
|---------|---------------------|---------------|
| Sedes, instituciones, programas | `catalogos-academicos/*` vs `certificacion/catalogos/*` vs `catalogos/sedes` | Mantener **catalogos-academicos** para consulta institucional; **certificacion/catalogos** para formularios de captura; deprecar alias redundante cuando migración frontend complete. |

### Pantallas SPA existentes (catálogos)

| Ruta | Componente | Estado |
|------|------------|--------|
| `/app/admin/catalogos` | `CatalogosPage` | Hub institucional |
| `/app/catalogos-academicos` | `CatalogosAcademicosPage` | Vista tabs completa |
| `/app/catalogos/subsistemas-instituciones` | `SubsistemasInstitucionesPage` | Operativa |
| `/app/catalogos/sedes` | `SedesSubsedesPage` | Operativa |
| `/app/catalogos/municipios` | `MunicipiosPage` | Operativa |
| `/app/catalogos/programas-ofertas` | `ProgramasOfertasPage` | Operativa |
| `/app/admin/menus` | `MenusPorRolPage` | Administración |
| `/app/admin/usuarios-roles` | `UsuariosRolesPage` | Administración |

**Sin ruta registrada:** `SistemasCatalogosPage` (página huérfana; no incluir en menú hasta definir alcance).

---

## Propuesta de menú final (sin saturar)

Principio: **ESTRUCTURA = consulta académica/territorial**; **CERTIFICACIÓN = flujos documentales**; **CONTROL ESCOLAR = operación académica**; **SISTEMA = administración técnica**.

### Estructura

| Orden | Etiqueta | Ruta | Notas |
|------:|----------|------|-------|
| 0 | Catálogos académicos | `/app/catalogos-academicos` | Vista integrada (ya existe) |
| 1 | Subsistemas / Instituciones | `/app/catalogos/subsistemas-instituciones` | Ya existe |
| 2 | Sedes y subsedes | `/app/catalogos/sedes` | Ya existe |
| 3 | Municipios | `/app/catalogos/municipios` | Ya existe |
| 4 | Programas y ofertas | `/app/catalogos/programas-ofertas` | Ya existe |
| — | *(futuro, no menú aún)* Ciclos escolares | `/app/catalogos/ciclos-escolares` | Cuando exista carga de datos + API |

**Hub opcional:** `/app/admin/catalogos` — entrada para perfiles admin/sistemas (ya existe).

### Certificación

No agregar ítems de “catálogo” al menú lateral. Los tipos y estados se consumen dentro de:

- Bandejas documentales (`/app/documentos/bandejas`)
- Solicitud y generación (`/app/certificacion/*`)
- Proceso técnico (`/app/sistemas/proceso-tecnico-certificacion`) — solo sistemas

### Control escolar

| Orden | Etiqueta | Ruta sugerida | Condición |
|------:|----------|---------------|-----------|
| 1 | Ciclos y periodos | `/app/control-escolar/ciclos-periodos` | Tras cargar `ciclos_escolares` |
| 2 | Inscripciones | (existente en flujo matrículas) | Sin catálogo de menú |
| 3 | Calificaciones | (existente) | Tras definir `escalas_calificacion` |

### Sistema

| Orden | Etiqueta | Ruta | Notas |
|------:|----------|------|-------|
| 1 | Usuarios y roles | `/app/admin/usuarios-roles` | Ya existe |
| 2 | Menús del sistema | `/app/admin/menus` | Ya existe |
| 3 | Catálogos técnicos | `/app/admin/catalogos` | Hub; no duplicar ESTRUCTURA |
| 4 | Configuración | `/app/admin/parametros` | Firma, parámetros |
| 5 | *(interno)* Plantillas / cadena / XML | Rutas sistemas | Sin menú usuario operativo |

---

## Matriz de decisión: ¿pantalla propia?

| Criterio | Pantalla propia | Solo API / interno |
|----------|:---------------:|:------------------:|
| Usuario operativo consulta frecuente | Instituciones, sedes, municipios, programas | — |
| Valores fijos de sistema (enums) | — | Estados workflow, xml, firma, pdf |
| Configuración técnica | — | Plantillas XML, reglas cadena, proveedores firma |
| Transaccional (folios, documentos) | Bandeja documental, no catálogo | Folios, series |
| Pendiente de datos | Ciclos escolares (cuando haya registros) | Turnos, grupos |

---

## Próximos 3 pasos recomendados

### 1. Cargar ciclos escolares institucionales (prioridad alta)

- Poblar `ciclos_escolares` con ciclos vigentes por subsistema.
- Exponer en `catalogos-academicos` (lectura) y reutilizar en matrícula/inscripción.
- Evaluar pantalla ligera en Control escolar o tab en Estructura **solo cuando haya datos**.

### 2. Formalizar catálogos de control escolar mínimos (prioridad alta)

- Definir enums o tablas para: `estatus_matricula`, `estatus_academico`, `tipos_inscripcion`.
- Documentar en PHP (como certificación) o tablas pequeñas según necesidad de edición institucional.
- **No crear pantallas aún**; consumir primero en expedientes y matrículas.

### 3. Cerrar consolidación del menú ESTRUCTURA (prioridad media)

- Ejecutar `SystemMenusSeeder` en ambientes donde persista texto legacy en BD.
- Unificar consumo frontend: preferir `catalogos-academicos` sobre `certificacion/catalogos` en pantallas de consulta.
- Eliminar o conectar `SistemasCatalogosPage` huérfana bajo módulo Sistema con alcance técnico explícito.

---

## Referencias técnicas

| Recurso | Ubicación |
|---------|-----------|
| API catálogos académicos | `app/Http/Controllers/Api/V1/Catalogos/CatalogosAcademicosController.php` |
| API captura certificación | `app/Http/Controllers/Api/V1/Certificacion/CatalogoCapturaController.php` |
| Tipos documento | `app/Http/Controllers/Api/Catalogos/DocumentoAcademicoTipoController.php` |
| Enums certificación | `app/Enums/Certificacion/*` |
| Seeders base | `database/seeders/Base/InstitutionalBaseSeeder.php` |
| Menús | `database/seeders/SystemMenusSeeder.php` |
| Importación académica | `app/Services/Importacion/SiseesCatalogosImportService.php` |
| Config legacy (referencia) | `config/sisees_catalogos.php` |
| Diagnóstico base | `php artisan sices:diagnosticar-base` |

---

*Documento generado por auditoría de código. No modifica datos ni esquema. Sin ejecución de tests.*
