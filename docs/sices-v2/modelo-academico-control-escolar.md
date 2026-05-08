# Modelo académico de Control Escolar (SICES v2)

Fecha: 2026-05-06

**Importación histórica (UI y payloads):** ver `docs/sices-v2/importacion-historica-ejemplos-payload.md` y la pantalla `/app/importaciones`.

## Objetivo

Evitar captura manual de materias por alumno cuando esas materias ya dependen del plan de estudios.  
Control Escolar debe operar sobre inscripciones, carga académica y calificaciones, no sobre definición libre de catálogo por estudiante.

## Inventario actual (existencia real)

| Componente | Estado | Evidencia |
|---|---|---|
| `niveles_academicos` | Existe | migración `create_niveles_academicos_table` |
| `programas_estudio` | Existe | migración `create_programas_estudio_table` |
| `planes_estudio` | Existe | migración `create_planes_estudio_table` |
| `materias` | Existe | migración `create_materias_table` |
| `plan_materias` | Nuevo (agregado) | migración `2026_05_06_141900_create_plan_materias_table` |
| `ciclos_escolares` | Existe | migración `create_ciclos_escolares_table` |
| `periodos_escolares` | Nuevo (agregado) | migración `2026_05_06_141910_create_periodos_grupos_generaciones_tables` |
| `grupos` | Nuevo (agregado) | misma migración anterior |
| `generaciones` | Nuevo (agregado) | misma migración anterior |
| `alumnos` | Existe | migración `create_alumnos_table` |
| `matriculas` | Existe + unique alumno | migración `create_matriculas_table` + `add_unique_alumno_id_to_matriculas_table` |
| `inscripciones_periodo` | Nuevo (agregado) | migración `2026_05_06_141920_create_inscripciones_periodo_table` |
| `cargas_academicas` | Nuevo (agregado) | migración `2026_05_06_141930_create_cargas_academicas_table` |
| `materias_cursadas` | Existe + extendida | migración base + `extend_materias_cursadas_for_plan_driven_flow` |
| `trayectorias_academicas` | Existe + extendida | migración base + `extend_trayectorias_academicas_for_plan_comparison` |

## Diseño funcional adoptado

Flujo académico:

1. Nivel académico
2. Programa/Carrera
3. Plan de estudios
4. Materias del plan (`plan_materias`)
5. Alumno (único por CURP)
6. Matrícula única por alumno
7. Inscripción por periodo/semestre
8. Generación automática de carga académica desde `plan_materias`
9. Materias cursadas/calificaciones
10. Trayectoria académica consolidada contra plan
11. Certificación con snapshot congelado

## Diferencia clave: `plan_materias` vs `materias_cursadas`

- `plan_materias`:
  - Define estructura curricular oficial del plan.
  - Contiene clave, nombre, semestre, orden y créditos de referencia.
  - Es fuente para generar carga académica.

- `materias_cursadas`:
  - Registra resultado académico del alumno en una oferta/inscripción concreta.
  - Hereda clave/nombre/semestre/créditos/orden desde `plan_materias` o `cargas_academicas`.
  - Captura calificación final, tipo de evaluación, estado de acreditación y periodo cursado real.

## Diferencia clave: matrícula vs inscripción por periodo

- Matrícula:
  - Identidad académica institucional única del alumno.
  - En SICES v2: `matriculas.alumno_id` con restricción `UNIQUE`.

- Inscripción por periodo:
  - Evento académico por ciclo/periodo/semestre.
  - Un alumno mantiene una sola matrícula, pero puede tener múltiples inscripciones a lo largo del tiempo.

## Generación de carga académica

- Entrada: inscripción de periodo (`inscripciones_periodo`) con matrícula y semestre.
- Regla:
  - Buscar plan de estudios de la oferta asociada a la matrícula.
  - Tomar `plan_materias` activas del semestre.
  - Generar `cargas_academicas` (evitando duplicados por inscripción + plan_materia).
- Servicio: `CargaAcademicaService`.

## Qué captura Control Escolar

Control Escolar **sí puede**:

- Crear alumno.
- Crear matrícula única.
- Inscribir alumno por ciclo/periodo/semestre.
- Generar carga académica desde plan.
- Importar y validar calificaciones.
- Recalcular trayectoria.
- Crear documento en borrador.

Control Escolar **no debe**:

- Capturar libremente materias del plan por cada alumno si existe `plan_materia`.
- Alterar plan curricular sin permisos superiores.
- Modificar documentos firmados.
- Alterar cadena/XML.

## Congelamiento para certificación

Antes de cadena/XML:

- Generar `documento_materias_snapshot` desde `materias_cursadas`.
- Congelar: clave, nombre, calificación, semestre, periodo, créditos y orden.
- Regla: certificación usa snapshot, no catálogo vivo.

## Integración histórica (Excel/Kardex)

Se preparó validación estructural:

- Servicio: `ImportacionHistoricaMateriasService`.
- Detecta:
  - faltantes respecto al plan
  - materias extra
  - claves inexistentes
  - semestre incorrecto

## UI (estado actual y lineamientos)

En captura de materias:

- Se añadieron campos para `inscripcion_periodo_id`, `carga_academica_id`, `plan_materia_id`.
- Cuando hay `carga_academica_id` o `plan_materia_id`, campos de clave/nombre/semestre/créditos deben mostrarse no editables.
- La captura libre queda bloqueada en backend cuando existe plan_materia aplicable al semestre.

Pantallas objetivo (incremental):

1. Planes de estudio
2. Materias del plan
3. Alumno
4. Matrícula única
5. Inscripción por periodo
6. Generación de carga académica
7. Importación/calificación
8. Trayectoria académica
9. Validación para certificación

## Pendiente de módulo docente

- Asignación docente-grupo-materia.
- Control de actas y cierres por periodo.
- Evaluación avanzada y recursamientos.
- Conciliación masiva UI de importación histórica.
