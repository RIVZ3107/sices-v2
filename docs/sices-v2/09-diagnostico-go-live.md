# 09 — Diagnóstico total y checklist go-live

## Diagnóstico ejecutivo

| Área | Calificación | Comentario |
|------|--------------|------------|
| Modelo de datos | ★★★★☆ | Sólido para certificación SEP; JSON metadata flexible |
| API / servicios | ★★★★☆ | Bien estructurada; duplicar permisos legacy/modular |
| Seguridad integraciones | ★★★★☆ | Flags OFF por defecto; token localStorage mejorable |
| RBAC | ★★★★☆ | Spatie + menús BD; requiere seed disciplinado |
| Frontend funcional | ★★★☆☆ | Completo pero fragmentado; muchas peticiones paralelas |
| UX consistencia | ★★☆☆☆ | Varios design systems; mejorando módulo ES |
| Código limpio | ★★★☆☆ | Stubs, páginas huérfanas, componentes duplicados |
| Tests | ★★★☆☆ | Buenos en menús/certificación; ampliar E2E |
| Escalabilidad | ★★★☆☆ | OK institucional medio; optimizar bandejas y archivado |

**Conclusión:** El sistema **puede operar con información real** si se configura producción correctamente, se sincronizan menús/permisos y se activan integraciones de forma controlada. La deuda principal es **frontend unificado** y **rendimiento de bandejas**.

## Riesgos críticos antes de producción

| # | Riesgo | Mitigación |
|---|--------|------------|
| 1 | Menús desactualizados en BD | Pipeline deploy con `SystemMenusSeeder` |
| 2 | `APP_DEBUG=true` | Forzar false en prod |
| 3 | Firma/Informix activados sin prueba | Staging + flags graduales |
| 4 | Usuarios sin alcance institucional | Poblar `usuario_instituciones/sedes` |
| 5 | XSS roba token Sanctum | CSP, sanitizar inputs, considerar cookies |
| 6 | Bandejas lentas con volumen | Eager loading + endpoint agregado + índices MySQL |
| 7 | Páginas ES en loading infinito | Timeouts (ya en UPN/supervisión); monitorear Network |

## Checklist go-live

### Infraestructura

- [ ] MySQL producción con backups
- [ ] `php artisan migrate --force`
- [ ] `php artisan config:cache` / `route:cache` (si aplica)
- [ ] Cola `database` o Redis para jobs PDF/firma
- [ ] HTTPS terminado en reverse proxy
- [ ] `npm run build` en CI; artefactos en `public/build`

### Seguridad

- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] `APP_KEY` único por entorno
- [ ] Credenciales BD y SINCE en gestor secretos
- [ ] `SINCE_FIRMA_ENABLED` solo tras UAT
- [ ] `INFORMIX_*` / `SICES_LEGACY_*` revisados
- [ ] Deshabilitar Telescope en prod
- [ ] No ejecutar `DemoUsuariosPorRolSeeder` en prod

### Datos y RBAC

- [ ] `RolesAndPermissionsSeeder`
- [ ] `SystemMenusSeeder`
- [ ] Usuarios reales con un rol principal claro
- [ ] Alcance institucional asignado
- [ ] Probar login por cada rol crítico (CE, ES, RC, Sistemas)

### Funcional crítico (smoke test)

- [ ] CE: crear borrador y enviar revisión
- [ ] ES: supervisión carga sin colgar
- [ ] ES: UPN bandeja + empty state
- [ ] RC: revisión institucional aprobar/observar
- [ ] RC: liberar a proceso técnico
- [ ] Sistemas: preflight + firma (staging SINCE)
- [ ] Consulta pública con token válido

### Monitoreo

- [ ] Revisar `integraciones_logs` tras primeras firmas
- [ ] Logs Laravel (`storage/logs`)
- [ ] Alertas en errores 500 API

## Roadmap técnico recomendado (3 fases)

### Fase 1 — Estabilización (1–2 sprints)

- Endpoint único bandeja supervisión/UPN
- Consolidar menús y permisos modular
- Eliminar controladores stub
- Documentación operativa (esta carpeta `docs/sices-v2`)

### Fase 2 — UX y rendimiento

- Unificar `components/ui`
- Tokens CSS globales
- Skeleton loaders consistentes
- Paginación server-side en tablas grandes

### Fase 3 — Producción integraciones

- UAT SINCE servicio 34
- Lectura Informix shadow
- Sync control escolar programado
- Archivado documentos por ciclo

## Mapa de documentación del proyecto

```
docs/sices-v2/
├── README.md                          ← Índice (empieza aquí)
├── 00-vision-general-arquitectura.md
├── 01-stack-tecnologico.md
├── 02-backend-api-modelos.md
├── 03-frontend-react.md
├── 04-base-datos-relaciones.md
├── 05-roles-menus-matriz.md
├── 06-seguridad-integraciones.md
├── 07-ux-ui-redundancias.md
├── 08-flujos-certificacion.md
├── 09-diagnostico-go-live.md
└── (docs especializados existentes)
```

## Índice de lo que pediste en el análisis integral

| Tema solicitado | Documento |
|-----------------|-----------|
| Tecnologías completas | [01](./01-stack-tecnologico.md) |
| Modelos, controladores, APIs | [02](./02-backend-api-modelos.md) |
| Rutas, vistas React, componentes | [03](./03-frontend-react.md) |
| BD, tablas, relaciones, JSON | [04](./04-base-datos-relaciones.md) |
| Matriz de roles | [05](./05-roles-menus-matriz.md) |
| Seeders (integración roles/menús) | [05](./05-roles-menus-matriz.md) |
| Seguridad y claves | [06](./06-seguridad-integraciones.md) |
| UX/UI y redundancias | [07](./07-ux-ui-redundancias.md) |
| Flujos e integraciones | [08](./08-flujos-certificacion.md) |
| Escalabilidad y diagnóstico | Este archivo + [00](./00-vision-general-arquitectura.md) |

---

*Documento vivo: actualizar cuando cambien seeders, rutas principales o integraciones.*
