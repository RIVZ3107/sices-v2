# Matriz de exposición frontend — Catálogos SICES v2

**Fecha:** 2026-06-05  
**Alcance:** Definición oficial de qué catálogos se muestran en frontend, cuáles tienen pantalla propia, cuáles se agrupan y cuáles permanecen internos/técnicos.  
**Base de datos:** `sincses` (MySQL) — diagnóstico `sices:diagnosticar-base`  
**Restricción:** Documento de arquitectura. No modifica esquema, datos ni pantallas.

---

## Estado de referencia (datos reales)

| Entidad | Registros |
|---------|-----------|
| Demo activo | 0 |
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
| ciclos_escolares | 1 (activo; ciclo actual `2025-2026`) |
| periodos_escolares | 1 (0 activos) |
| estatus_academicos | 0 (tabla pendiente de migración) |
| estatus_matricula | 0 (tabla pendiente de migración) |
| escalas_calificacion | 0 (tabla pendiente de migración) |

---

## Leyenda de columnas

| Columna | Significado |
|---------|-------------|
| **Categoría** | Agrupación funcional (A–D). |
| **Catálogo** | Nombre canónico del catálogo. |
| **Tabla/config/origen** | Tabla MySQL, enum PHP, config o columna embebida. |
| **Existe actualmente** | Infraestructura persistente desplegada (tabla o enum registrado). `Código` = implementado en repo pero sin tabla en BD. |
| **Tiene datos** | Registros reales en BD al momento del diagnóstico. |
| **Se muestra en frontend** | Visible para usuario operativo (pantalla, tab o selector en flujo). |
| **Pantalla propia** | Entrada independiente en menú lateral. |
| **Agrupado en pantalla** | Pantalla compartida donde se consulta o configura. |
| **Módulo sugerido** | Sección de menú destino. |
| **Roles que pueden verlo** | Consulta institucional. |
| **Roles que pueden editarlo** | Configuración / CRUD. |
| **Prioridad** | Alta / Media / Baja para operación institucional. |
| **Observaciones** | Decisión arquitectónica y estado técnico. |

**Capas de catálogo en SICES v2:**

1. **Tabla catálogo** — entidad editable (`instituciones`, `ciclos_escolares`).
2. **Enum/config** — valores fijos en PHP (`EstadoWorkflow`, `TipoDocumentoAcademico`).
3. **Operacional** — transaccional que usa catálogos (`folios`, `documentos_academicos`).
4. **Columna embebida** — string/enum en tabla operativa (`alumnos.estatus`, `ofertas_academicas.modalidad`).

---

## A) Estructura académica

| Categoría | Catálogo | Tabla/config/origen | Existe actualmente | Tiene datos | Se muestra en frontend | Pantalla propia | Agrupado en pantalla | Módulo sugerido | Roles que pueden verlo | Roles que pueden editarlo | Prioridad | Observaciones |
|-----------|----------|---------------------|:------------------:|:-----------:|:----------------------:|:---------------:|----------------------|-----------------|------------------------|---------------------------|:---------:|---------------|
| A | subsistemas | `subsistemas` | sí | sí (2) | sí | no | Catálogos académicos · Subsistemas/Instituciones | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela (consulta) | superadmin, admin, sistemas, educacion_superior | Alta | Núcleo UPN/Normal. API `catalogos-academicos/subsistemas`. |
| A | regiones | `regiones` | sí | sí (3) | parcial | no | Subsistemas/Instituciones (filtro) | Estructura académica | superadmin, admin, sistemas, educacion_superior | superadmin, admin, sistemas, educacion_superior | Media | Sin pantalla dedicada. Solo filtro territorial en instituciones. |
| A | instituciones | `instituciones` | sí | sí (14) | sí | no | Catálogos académicos · Subsistemas/Instituciones | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas, educacion_superior | Alta | Importadas desde legacy. Hub principal de estructura. |
| A | sedes | `sedes` | sí | sí (18) | sí | **sí** | — (también en Catálogos académicos) | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela | superadmin, admin, sistemas, educacion_superior | Alta | Pantalla `/app/catalogos/sedes`. |
| A | entidades_federativas | `entidades_federativas` | sí | sí (32) | parcial | no | Municipios (columna/filtro) | Estructura académica | superadmin, admin, sistemas, educacion_superior | superadmin, admin, sistemas | Media | Catálogo territorial de soporte; no requiere menú propio. |
| A | municipios | `municipios` | sí | sí (125) | sí | **sí** | — | Estructura académica | superadmin, admin, sistemas, educacion_superior | superadmin, admin, sistemas | Alta | Pantalla `/app/catalogos/municipios`. |
| A | niveles_academicos | `niveles_academicos` | sí | sí (5) | parcial | **no** | Programas y ofertas (columna) | Estructura académica | superadmin, admin, sistemas, educacion_superior | superadmin, admin, sistemas | Media | **No pantalla propia.** Valores base LIC/MAE/etc. Consulta vía join en programas. |
| A | programas_estudio | `programas_estudio` | sí | sí (36) | sí | no | Catálogos académicos · Programas y ofertas | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas, educacion_superior | Alta | Importados. Agrupados con planes y ofertas. |
| A | planes_estudio | `planes_estudio` | sí | sí (31) | sí | no | Catálogos académicos · Programas y ofertas | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela | superadmin, admin, sistemas, educacion_superior | Alta | Agrupados con programas, ofertas y plan_materias. |
| A | materias | `materias` | sí | sí (1 054) | sí | no | Catálogos académicos (tab Materias) | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela | superadmin, admin, sistemas, educacion_superior | Alta | Consulta masiva; edición futura vía estructura curricular. |
| A | plan_materias | `plan_materias` | sí | sí (1 153) | sí | no | Catálogos académicos · Programas y ofertas (estructura curricular) | Estructura académica | superadmin, admin, sistemas, educacion_superior | superadmin, admin, sistemas, educacion_superior | Alta | Vista “estructura curricular” dentro de programas/planes. |
| A | ofertas_academicas | `ofertas_academicas` | sí | sí (86) | sí | no | Catálogos académicos · Programas y ofertas | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela | superadmin, admin, sistemas, educacion_superior | Alta | Incluye modalidad como columna enum. |
| A | modalidades | enum en `ofertas_academicas.modalidad` | parcial | sí (embebido) | parcial | **no** | Programas y ofertas (columna) | Estructura académica | todos los que ven ofertas | superadmin, admin, sistemas, educacion_superior | Media | **No pantalla propia.** Valores: escolarizada, mixta, no_escolarizada. |
| A | turnos | columna `grupos.turno` (string) | no | no | no | **no** | Grupos (futuro, operacional) | Control escolar | — | — | Baja | **No pantalla propia.** Sin tabla catálogo; pendiente con operación de grupos. |
| A | ciclos_escolares | `ciclos_escolares` | sí | sí (1) | sí | no | **Ciclos y periodos** | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas | Alta | Operativo. Pantalla agrupada `/app/catalogos/ciclos-periodos`. |
| A | periodos_escolares | `periodos_escolares` | sí | sí (1) | sí | no | **Ciclos y periodos** | Estructura académica | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas | Alta | Agrupado con ciclos. API `catalogos-academicos/ciclos-escolares/*`. |

---

## B) Certificación / documentos

| Categoría | Catálogo | Tabla/config/origen | Existe actualmente | Tiene datos | Se muestra en frontend | Pantalla propia | Agrupado en pantalla | Módulo sugerido | Roles que pueden verlo | Roles que pueden editarlo | Prioridad | Observaciones |
|-----------|----------|---------------------|:------------------:|:-----------:|:----------------------:|:---------------:|----------------------|-----------------|------------------------|---------------------------|:---------:|---------------|
| B | tipos_documento | enum `TipoDocumentoAcademico` + `TipoDocumentoSeeder` | parcial | n/a | parcial | **no** | Formularios certificación / solicitud documental | Certificación | control_escolar_escuela, educacion_superior, certificador, sistemas | sistemas (config técnica) | Alta | **No pantalla propia.** API `catalogos/documentos-academicos/tipos`. |
| B | tipos_certificacion | enum `TipoCertificacion` | parcial | n/a | parcial | **no** | Flujo documento (interno) | Certificación | certificador, sistemas | sistemas | Media | Uso interno del motor documental. |
| B | estados_documento | enum `EstadoWorkflow` | parcial | n/a | parcial | **no** | Bandejas documentales | Certificación | control_escolar_escuela, certificador, educacion_superior | — (workflow) | Alta | **No pantalla propia.** Se refleja en bandejas y detalle de documento. |
| B | estados_cadena | enum `EstadoCadena` | parcial | n/a | parcial | **no** | Proceso técnico certificación | Sistema | sistemas, superadmin | sistemas | Media | **No pantalla propia.** Solo perfil técnico. |
| B | estados_xml | enum `EstadoXml` | parcial | n/a | parcial | **no** | Proceso técnico certificación | Sistema | sistemas | sistemas | Media | **No pantalla propia.** |
| B | estados_firma | enum `EstadoFirma` | parcial | n/a | parcial | **no** | Proceso técnico / firma electrónica | Sistema | sistemas, certificador (seguimiento) | sistemas | Media | **No pantalla propia.** |
| B | estados_pdf | enum `EstadoPdf` | parcial | n/a | parcial | **no** | Proceso técnico certificación | Sistema | sistemas | sistemas | Media | **No pantalla propia.** |
| B | proveedores_firma | enum `ProveedorFirma` + `firma_configuraciones` | parcial | sí (config) | parcial | **no** | Configuración técnica / parámetros | Sistema | sistemas, superadmin | sistemas, superadmin | Media | **No pantalla propia.** Configuración en `/app/admin/parametros` y módulo sistemas. |
| B | reglas_cadena_original | `cadena_original_reglas` | sí | sí (seed) | no | no | — (solo técnico) | Sistema | sistemas, superadmin | sistemas, superadmin | Alta | **Catálogo técnico.** Sin exposición operativa. |
| B | plantillas_xml | `xml_plantillas` | sí | sí (seed) | no | no | — (solo técnico) | Sistema | sistemas, superadmin | sistemas, superadmin | Alta | **Catálogo técnico.** Motor DEC/XML. |
| B | plantillas_documento | `plantillas_documento` | sí | sí (seed) | no | no | — (solo técnico) | Sistema | sistemas, superadmin | sistemas, superadmin | Alta | **Catálogo técnico.** Motor PDF/HTML. |
| B | folios | `folios` | sí | no (0) | parcial | no | Bandejas certificación / emisión (operación) | Certificación | certificador, control_escolar_escuela, educacion_superior | certificador, sistemas | Media | Transaccional, no catálogo navegable. |
| B | series_folio | lógica en `folios` (prefijo + tipo + ciclo) | no | no | no | no | Folios y emisión (futuro) | Certificación | certificador, sistemas | sistemas, superadmin | Media | **Faltante como catálogo.** Evaluar tabla si instituciones requieren prefijos configurables. |
| B | motivos_rechazo | texto libre en solicitudes/documentos | no | no | parcial | no | Solicitudes / bandejas (texto libre) | Control escolar | control_escolar_escuela, educacion_superior | control_escolar_escuela | Media | **Faltante como catálogo.** Campo libre hoy. |
| B | motivos_cancelacion | metadata en inscripciones/workflow | no | no | parcial | no | Inscripciones / documentos | Control escolar | control_escolar_escuela | control_escolar_escuela | Media | **Faltante como catálogo.** |

### Entidades técnicas de certificación (sin fila en menú)

| Catálogo | Tabla | Existe | Módulo | Roles | Observaciones |
|----------|-------|:------:|--------|-------|---------------|
| firma_configuraciones | `firma_configuraciones` | sí | Sistema | sistemas, superadmin | Config por subsistema/tipo documento. |
| firmantes_autorizados | `firmantes_autorizados` | sí | Sistema | sistemas, superadmin | Catálogo operativo de firmantes. |
| credenciales_firma | `credenciales_firma` | sí | Sistema | sistemas, superadmin | Credenciales técnicas. |
| ventanas_operacion | `ventanas_operacion` | sí | Sistema | sistemas, superadmin | Ventanas de timbrado/firma. |

---

## C) Control escolar

| Categoría | Catálogo | Tabla/config/origen | Existe actualmente | Tiene datos | Se muestra en frontend | Pantalla propia | Agrupado en pantalla | Módulo sugerido | Roles que pueden verlo | Roles que pueden editarlo | Prioridad | Observaciones |
|-----------|----------|---------------------|:------------------:|:-----------:|:----------------------:|:---------------:|----------------------|-----------------|------------------------|---------------------------|:---------:|---------------|
| C | estatus_academico | `estatus_academicos` (Código; migración pendiente) | Código | no | sí (código) | no | **Configuración académica** (`/app/control-escolar/catalogos`) | Control escolar | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas | Alta | Hoy: columna string en `alumnos`. Tabla+API+pantalla en repo; **pendiente `php artisan migrate` + seed**. |
| C | estatus_matricula | `estatus_matricula` (Código; migración pendiente) | Código | no | sí (código) | no | **Configuración académica** | Control escolar | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas | Alta | Hoy: columna `matriculas.estado`. Agrupado con estatus académicos y escalas. |
| C | tipos_inscripcion | — | no | no | no | no | **Configuración académica** (futuro) | Control escolar | control_escolar_escuela, educacion_superior | superadmin, admin, sistemas | Media | **Faltante.** Lógica dispersa en servicios/metadata. |
| C | tipos_baja | — | no | no | no | no | **Configuración académica** (futuro) | Control escolar | control_escolar_escuela | superadmin, admin, sistemas | Media | **Faltante.** Requerido para bajas institucionalizadas. |
| C | motivos_baja | — | no | no | no | no | **Configuración académica** (futuro) | Control escolar | control_escolar_escuela | superadmin, admin, sistemas | Media | **Faltante.** |
| C | tipos_movimiento | — | no | no | no | no | **Configuración académica** (futuro) | Control escolar | control_escolar_escuela | superadmin, admin, sistemas | Baja | **Faltante.** Movimientos académicos no modelados. |
| C | periodos_inscripcion | `periodos_escolares` (ventanas de inscripción) | sí | sí (1) | parcial | no | Ciclos y periodos | Estructura académica / Control escolar | control_escolar_escuela, educacion_superior | superadmin, admin, sistemas | Alta | Misma tabla que periodos escolares; ventanas en columnas de fechas. No duplicar pantalla. |
| C | escalas_calificacion | `escalas_calificacion` (Código; migración pendiente) | Código | no | sí (código) | no | **Configuración académica** | Control escolar | superadmin, admin, sistemas, educacion_superior, control_escolar_escuela, certificador | superadmin, admin, sistemas | Alta | Hoy: umbral en `config/certificacion.php`. Tabla en repo pendiente de migrate. |
| C | tipos_carga_academica | columna `cargas_academicas.estatus` | no | no | no | no | Calificaciones (futuro) | Control escolar | control_escolar_escuela | superadmin, admin, sistemas | Media | **Faltante** como catálogo. 0 cargas operativas. |

---

## D) Seguridad y operación

| Categoría | Catálogo | Tabla/config/origen | Existe actualmente | Tiene datos | Se muestra en frontend | Pantalla propia | Agrupado en pantalla | Módulo sugerido | Roles que pueden verlo | Roles que pueden editarlo | Prioridad | Observaciones |
|-----------|----------|---------------------|:------------------:|:-----------:|:----------------------:|:---------------:|----------------------|-----------------|------------------------|---------------------------|:---------:|---------------|
| D | roles | Spatie `roles` | sí | sí (15) | sí | no | Usuarios y roles | Sistema | superadmin, admin, sistemas | superadmin, admin, sistemas | Alta | Pantalla `/app/admin/usuarios-roles`. |
| D | permisos | Spatie `permissions` | sí | sí (3 471) | sí | no | Usuarios y roles | Sistema | superadmin, admin, sistemas | superadmin, admin, sistemas | Alta | Asignación granular vía `SicesPermissionsCatalog`. |
| D | menus | `menus` | sí | sí (148) | sí | **sí** | — | Sistema | superadmin, admin, sistemas | superadmin, admin, sistemas | Alta | Pantalla `/app/admin/menus`. |
| D | alcances_usuario | `usuario_regiones`, `usuario_instituciones`, `usuario_sedes` | sí | variable | parcial | no | Usuarios y roles | Sistema | superadmin, admin, sistemas | superadmin, admin, sistemas | Alta | Sin pantalla catálogo independiente. |
| D | tipos_usuario | roles Spatie (sin tabla) | parcial | n/a | parcial | no | Usuarios y roles | Sistema | superadmin, admin, sistemas | superadmin, admin, sistemas | Baja | El rol cumple la función de tipo. |
| D | estatus_usuario | — (sin columna formal en `users`) | no | no | no | no | Usuarios (futuro) | Sistema | superadmin, admin, sistemas | superadmin, admin, sistemas | Media | **Faltante.** Sin baja lógica formalizada. |

---

## Resumen de decisiones arquitectónicas

### 1. Principio rector

**El sidebar solo agrupa módulos de operación real.** Los catálogos se exponen de tres formas:

| Forma | Cuándo | Ejemplo |
|-------|--------|---------|
| **Pantalla propia** | Consulta frecuente, volumen alto, navegación autónoma | Sedes, Municipios |
| **Pantalla agrupada** | Catálogos relacionados que se configuran juntos | Ciclos + periodos; Programas + planes + ofertas |
| **Interno / técnico** | Enums, plantillas, reglas, estados de proceso | Estados XML, plantillas DEC |
| **Embebido en flujo** | Selector en formulario operativo | Tipos de documento en solicitud |

### 2. Catálogos que **NO** deben tener pantalla propia

| Catálogo | Motivo |
|----------|--------|
| modalidades | Enum en oferta; 3 valores estables |
| turnos | Columna en grupos; sin datos ni operación de grupos |
| niveles_academicos | Catálogo de soporte; visible como columna en programas |
| tipos_documento | Selector en flujos de certificación |
| estados_documento | Reflejado en bandejas, no como catálogo |
| estados_cadena | Proceso técnico interno |
| estados_xml | Proceso técnico interno |
| estados_firma | Seguimiento técnico / certificación |
| estados_pdf | Proceso técnico interno |
| proveedores_firma | Configuración técnica de firma |
| regiones | Filtro en instituciones |
| entidades_federativas | Soporte de municipios |
| folios | Transaccional, no catálogo |
| permisos | Granularidad excesiva para menú propio |

### 3. Catálogos que **sí** requieren pantalla agrupada

| Pantalla agrupada | Catálogos incluidos | Ruta actual / sugerida | Estado |
|-------------------|---------------------|------------------------|--------|
| **Catálogos académicos** | instituciones, sedes, programas, planes, materias, plan_materias, ofertas, subsistemas, municipios (tabs) | `/app/catalogos-academicos` | Operativa |
| **Subsistemas / Instituciones** | subsistemas, instituciones, regiones (filtro) | `/app/catalogos/subsistemas-instituciones` | Operativa |
| **Programas y ofertas** | programas_estudio, planes_estudio, ofertas_academicas, plan_materias, niveles_academicos, modalidades | `/app/catalogos/programas-ofertas` | Operativa |
| **Ciclos y periodos** | ciclos_escolares, periodos_escolares, periodos_inscripcion (ventanas) | `/app/catalogos/ciclos-periodos` | Operativa |
| **Configuración académica** | estatus_academico, estatus_matricula, escalas_calificacion + futuro: tipos_inscripcion, tipos_baja, motivos_baja, tipos_movimiento | `/app/control-escolar/catalogos` | Código listo; BD pendiente migrate |

### 4. Catálogos técnicos (solo sistemas / superadmin)

| Catálogo | Acceso |
|----------|--------|
| reglas_cadena_original | sistemas, superadmin |
| plantillas_xml | sistemas, superadmin |
| plantillas_documento | sistemas, superadmin |
| firma_configuraciones | sistemas, superadmin |
| firmantes_autorizados | sistemas, superadmin |
| credenciales_firma | sistemas, superadmin |
| series_folio (cuando exista) | sistemas, superadmin |
| ventanas_operacion | sistemas, superadmin |
| proveedores_firma (config) | sistemas, superadmin |
| Catálogos técnicos (hub) | `/app/admin/catalogos` — sistemas, superadmin |

**No exponer en menú operativo:** procesos DEC/XML/cadena/firma/PDF salvo bandeja técnica en `/app/sistemas/*`.

### 5. Pantallas con entrada propia en menú (consolidado)

| Pantalla | Ruta | Módulo |
|----------|------|--------|
| Catálogos académicos | `/app/catalogos-academicos` | Estructura académica |
| Subsistemas / Instituciones | `/app/catalogos/subsistemas-instituciones` | Estructura académica |
| Sedes y subsedes | `/app/catalogos/sedes` | Estructura académica |
| Ciclos y periodos | `/app/catalogos/ciclos-periodos` | Estructura académica |
| Municipios | `/app/catalogos/municipios` | Estructura académica |
| Programas y ofertas | `/app/catalogos/programas-ofertas` | Estructura académica |
| Configuración académica | `/app/control-escolar/catalogos` | Control escolar |
| Menús del sistema | `/app/admin/menus` | Sistema |
| Usuarios y roles | `/app/admin/usuarios-roles` | Sistema |
| Catálogos técnicos | `/app/admin/catalogos` | Sistema (solo sistemas/superadmin) |
| Configuración | `/app/admin/parametros` | Sistema |

**No registrar en menú:** `SistemasCatalogosPage` (huérfana) hasta definir alcance técnico explícito.

---

## Menú final recomendado (sin saturar)

Principio: máximo **6 ítems** por sección en sidebar; catálogos técnicos fuera del menú operativo.

### ESTRUCTURA ACADÉMICA

| Orden | Etiqueta | Ruta | Roles |
|------:|----------|------|-------|
| 0 | Catálogos académicos | `/app/catalogos-academicos` | superadmin, admin, sistemas, educacion_superior |
| 1 | Subsistemas / Instituciones | `/app/catalogos/subsistemas-instituciones` | superadmin, admin, sistemas |
| 2 | Sedes y subsedes | `/app/catalogos/sedes` | superadmin, admin, sistemas, educacion_superior |
| 3 | Ciclos y periodos | `/app/catalogos/ciclos-periodos` | superadmin, admin, sistemas, educacion_superior |
| 4 | Municipios | `/app/catalogos/municipios` | superadmin, admin, sistemas |
| 5 | Programas y ofertas | `/app/catalogos/programas-ofertas` | superadmin, admin, sistemas, educacion_superior |

**No agregar:** regiones, niveles_academicos, modalidades, materias sueltas (ya en hub).

### CONTROL ESCOLAR

| Orden | Etiqueta | Ruta | Roles | Notas |
|------:|----------|------|-------|-------|
| 1 | Dashboard | `/app/dashboard` | control_escolar_escuela | Existente |
| 2 | Alumnos | `/app/control-escolar/alumnos` | control_escolar_escuela | Operación |
| 3 | Expedientes | `/app/control-escolar/expedientes` | control_escolar_escuela | Operación |
| 4 | Inscripciones | `/app/control-escolar/inscripciones` | control_escolar_escuela | Operación (no catálogo) |
| 5 | Reinscripciones | `/app/control-escolar/reinscripciones` | control_escolar_escuela | Operación |
| 6 | **Configuración académica** | `/app/control-escolar/catalogos` | control_escolar_escuela (lectura), admin/sistemas (edición) | Renombrar menú actual “Catálogos de control escolar” |
| 7 | Trayectoria académica | `/app/control-escolar/trayectoria` | control_escolar_escuela | Operación |
| 8 | Calificaciones | `/app/control-escolar/calificaciones` | control_escolar_escuela | Operación |
| 9 | Documentos | `/app/control-escolar/documentos` | control_escolar_escuela | Operación |
| — | Reportes, Bajas, Importaciones… | rutas existentes | — | Mantener; no duplicar catálogos |

**Matrícula:** no requiere ítem de catálogo; es flujo en Inscripciones/Reinscripciones/Expedientes.

### CERTIFICACIÓN

Sin ítems de “catálogo” en sidebar. Agrupar operación:

| Orden | Etiqueta | Ruta | Roles |
|------:|----------|------|-------|
| 1 | Bandejas de certificación | `/app/documentos/bandejas` o `/app/certificacion/*` | certificador, control_escolar_escuela |
| 2 | Documentos académicos | `/app/control-escolar/documentos` / módulo certificación | certificador, control_escolar_escuela |
| 3 | Folios y emisión | Integrado en flujo documental (futuro panel) | certificador, sistemas |
| 4 | Configuración documental | `/app/admin/parametros` + `/app/sistemas/configuracion` | **solo sistemas, superadmin** |

### SISTEMA

| Orden | Etiqueta | Ruta | Roles |
|------:|----------|------|-------|
| 1 | Usuarios | `/app/admin/usuarios-roles` | superadmin, admin, sistemas |
| 2 | Roles y permisos | `/app/admin/usuarios-roles` (misma pantalla) | superadmin, admin, sistemas |
| 3 | Menús del sistema | `/app/admin/menus` | superadmin, admin, sistemas |
| 4 | Configuración | `/app/admin/parametros` | superadmin, admin, sistemas |
| 5 | Catálogos técnicos | `/app/admin/catalogos` | **solo sistemas, superadmin** |
| — | Integraciones, Logs, Proceso técnico | `/app/sistemas/*` | sistemas (sección TÉCNICO) |

### Ajuste de menú respecto al estado actual

| Situación actual | Recomendación |
|------------------|---------------|
| “Catálogos de control escolar” en ESTRUCTURA (admin/sistemas) | Mover percepción a **Control escolar → Configuración académica**; admin puede mantener acceso vía permiso sin duplicar en ESTRUCTURA |
| “Catálogos de control escolar” en CERT (certificador) | Mantener solo **lectura**; certificador no edita escalas |
| educacion_superior tiene catálogos CE en OPERACION | Mantener consulta; sin edición |
| Hub `/app/admin/catalogos` | Solo enlace a módulos ESTRUCTURA + nota de catálogos técnicos |

---

## Mapa API ↔ Frontend

| Prefijo API | Uso frontend | Deprecación |
|-------------|--------------|-------------|
| `/api/v1/catalogos-academicos/*` | Consulta institucional (pantallas ESTRUCTURA) | **Canónico** |
| `/api/v1/catalogos-control-escolar/*` | Configuración académica CE | **Canónico** (tras migrate) |
| `/api/v1/certificacion/catalogos/*` | Selectores en captura/alta alumno | Mantener para formularios |
| `/api/v1/catalogos/sedes` | Alias legacy | Deprecar cuando frontend unifique |

---

## Catálogos internos (no frontend operativo)

Resumen de lo que **no** debe aparecer en menú ni pantalla dedicada para perfiles operativos:

- Todos los enums de estados de certificación (workflow, cadena, xml, firma, pdf)
- Plantillas XML, plantillas documento, reglas cadena original
- Firma: configuraciones, firmantes, credenciales, ventanas de operación
- Modalidades, turnos, niveles_academicos (como pantalla)
- Folios y series (como catálogo; sí como operación transaccional)
- Permisos individuales (3 471 entradas)
- Motivos rechazo/cancelación (hasta formalizar catálogo)

---

## Próximos pasos recomendados (ordenados)

### Paso 1 — Activar configuración académica en BD (sin nuevas pantallas)

1. Ejecutar migración pendiente `2026_06_06_140000_create_catalogos_control_escolar_tables`.
2. Ejecutar seeders `EstatusAcademicoSeeder`, `EstatusMatriculaSeeder`, `EscalaCalificacionSeeder`.
3. Re-sembrar permisos y menús si aplica.
4. Validar `/app/control-escolar/catalogos` y diagnóstico base.

### Paso 2 — Consolidar menú según esta matriz

1. Renombrar ítem de menú `ce_cat` / `sa_ce_cat` a **“Configuración académica”**.
2. Retirar duplicado de ESTRUCTURA para admin (opcional): un solo punto de entrada en Control escolar.
3. Confirmar que certificador y educacion_superior solo tienen permiso `control_escolar.catalogos.ver`.

### Paso 3 — Formalizar catálogos CE faltantes (diseño, no pantalla aún)

1. Definir tablas o enums para: `tipos_inscripcion`, `tipos_baja`, `motivos_baja`.
2. Integrarlos en la misma pantalla **Configuración académica** (nuevas pestañas).
3. Conectar `alumnos.estatus` y `matriculas.estado` a catálogos centralizados.

### Paso 4 — Certificación (media prioridad)

1. Evaluar catálogo `series_folio` si instituciones requieren prefijos configurables.
2. Formalizar `motivos_rechazo` y `motivos_cancelacion` como listas institucionales.
3. Panel “Folios y emisión” dentro de certificación (operación, no catálogo de menú).

### Paso 5 — Limpieza técnica (baja prioridad)

1. Conectar o eliminar `SistemasCatalogosPage` huérfana.
2. Unificar consumo frontend: preferir `catalogos-academicos` sobre `certificacion/catalogos` en consultas.
3. Documentar enums de certificación en hub técnico `/app/admin/catalogos` (solo lectura para sistemas).

---

## Referencias

| Recurso | Ubicación |
|---------|-----------|
| Inventario previo | `docs/sices-v2/catalogos/inventario-catalogos-sices-v2.md` |
| API académicos | `app/Http/Controllers/Api/V1/Catalogos/CatalogosAcademicosController.php` |
| API ciclos | `app/Http/Controllers/Api/V1/Catalogos/CiclosEscolaresController.php` |
| API control escolar | `app/Http/Controllers/Api/V1/Catalogos/CatalogosControlEscolarController.php` |
| API captura certificación | `app/Http/Controllers/Api/V1/Certificacion/CatalogoCapturaController.php` |
| Enums certificación | `app/Enums/Certificacion/*` |
| Permisos | `database/seeders/Support/SicesPermissionsCatalog.php` |
| Menús | `database/seeders/SystemMenusSeeder.php` |
| Pantallas SPA catálogo | `resources/js/pages/catalogos/*`, `catalogosAcademicos/*`, `controlEscolar/CatalogosControlEscolarPage.jsx` |
| Diagnóstico | `php artisan sices:diagnosticar-base` |

---

*Documento generado por auditoría de código y diagnóstico de base. No modifica datos, esquema ni pantallas. Sin ejecución de tests.*
