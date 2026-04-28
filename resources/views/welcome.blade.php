<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SICES v2 · Plataforma Institucional</title>
    <style>
        :root {
            --bg: #f3f6fa;
            --surface: #ffffff;
            --border: #d7dee8;
            --text: #0f172a;
            --muted: #64748b;
            --navy: #0b1f3a;
            --blue: #1d4ed8;
            --blue-soft: #dbeafe;
            --gold: #b0892f;
            --radius: 18px;
            --shadow: 0 18px 44px rgba(15, 23, 42, 0.1);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            font-family: "Segoe UI", Roboto, Arial, sans-serif;
            color: var(--text);
            background:
                radial-gradient(900px 520px at 8% 5%, rgba(29, 78, 216, 0.14), transparent 60%),
                radial-gradient(900px 520px at 90% 95%, rgba(176, 137, 47, 0.14), transparent 62%),
                var(--bg);
        }

        .page {
            min-height: 100vh;
            width: min(1180px, 100%);
            margin: 0 auto;
            padding: 28px 20px;
            display: grid;
            gap: 18px;
        }

        .topbar {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            color: var(--navy);
            letter-spacing: -0.02em;
        }

        .brand-mark {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: linear-gradient(140deg, var(--navy), var(--blue));
        }

        .badge {
            font-size: 12px;
            color: #1e3a8a;
            background: var(--blue-soft);
            border: 1px solid #bfdbfe;
            border-radius: 999px;
            padding: 4px 10px;
            font-weight: 600;
        }

        .hero {
            border-radius: var(--radius);
            border: 1px solid var(--border);
            background: linear-gradient(145deg, #0b1f3a 0%, #102a4c 56%, #173d6a 100%);
            color: #e2e8f0;
            box-shadow: var(--shadow);
            overflow: hidden;
        }

        .hero-grid {
            display: grid;
            grid-template-columns: 1.2fr .8fr;
            gap: 18px;
            padding: 34px;
        }

        .hero h1 {
            margin: 0;
            font-size: clamp(1.8rem, 3vw, 2.5rem);
            letter-spacing: -0.02em;
            color: #f8fafc;
        }

        .hero h2 {
            margin: 10px 0 0;
            font-size: clamp(1rem, 1.7vw, 1.2rem);
            color: #bfdbfe;
            font-weight: 600;
        }

        .hero p {
            margin: 16px 0 0;
            color: #cbd5e1;
            line-height: 1.6;
            max-width: 58ch;
        }

        .cta-row {
            margin-top: 22px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .btn {
            text-decoration: none;
            border-radius: 12px;
            padding: 11px 18px;
            font-weight: 700;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: .2s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
            color: #fff;
            box-shadow: 0 10px 24px rgba(29, 78, 216, 0.35);
        }

        .btn-secondary {
            border: 1px solid rgba(191, 219, 254, 0.5);
            color: #dbeafe;
            background: rgba(255, 255, 255, 0.06);
        }

        .hint {
            font-size: 13px;
            color: #cbd5e1;
        }

        .hero-card {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 14px;
            padding: 16px;
        }

        .hero-card h3 {
            margin: 0 0 8px;
            font-size: 15px;
            color: #dbeafe;
        }

        .hero-card ul {
            margin: 0;
            padding-left: 18px;
            color: #cbd5e1;
            display: grid;
            gap: 7px;
            font-size: 14px;
        }

        .flow-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
        }

        .flow-step {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 16px;
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05);
        }

        .flow-step b {
            color: var(--navy);
            font-size: 14px;
            display: block;
            margin-bottom: 7px;
        }

        .flow-step span {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.45;
        }

        .foot {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 14px 16px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            font-size: 13px;
            color: var(--muted);
        }

        .foot strong {
            color: var(--navy);
            font-weight: 700;
        }

        .gold {
            color: var(--gold);
            font-weight: 700;
        }

        @media (max-width: 980px) {
            .hero-grid {
                grid-template-columns: 1fr;
                padding: 24px;
            }

            .flow-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <main class="page">
        <header class="topbar">
            <div class="brand">
                <span class="brand-mark"></span>
                <span>SICES v2 · Plataforma Institucional</span>
            </div>
            <span class="badge">Control Escolar · Certificación Académica</span>
        </header>

        <section class="hero">
            <div class="hero-grid">
                <div>
                    <h1>Sistema Institucional de Certificación y Control Escolar</h1>
                    <h2>Nivel Superior · Operación documental con trazabilidad</h2>
                    <p>
                        SICES v2 centraliza la captura académica, revisión institucional, validación y seguimiento
                        de documentos con un flujo formal, auditable y preparado para fases técnicas posteriores.
                    </p>
                    <div class="cta-row">
                        <a class="btn btn-primary" href="/login">Iniciar sesión</a>
                        <a class="btn btn-secondary" href="/app/dashboard">Ir al panel</a>
                        <span class="hint">Acceso exclusivo para usuarios autorizados.</span>
                    </div>
                </div>

                <aside class="hero-card">
                    <h3>Alcance operativo actual</h3>
                    <ul>
                        <li>Captura y actualización de expediente académico.</li>
                        <li>Bandejas por rol para revisión y seguimiento.</li>
                        <li>Gestión de observaciones y devoluciones.</li>
                        <li>Validación académica previa a preparación de firma.</li>
                        <li>Panel técnico sin ejecución de firma real.</li>
                    </ul>
                </aside>
            </div>
        </section>

        <section class="flow-grid">
            <article class="flow-step">
                <b>1. Control Escolar Escuela</b>
                <span>Captura alumnos, matrículas, materias y trayectoria para integrar expediente documental.</span>
            </article>
            <article class="flow-step">
                <b>2. Educación Superior</b>
                <span>Revisa documentos, emite observaciones, valida consistencia y dictamina aprobación.</span>
            </article>
            <article class="flow-step">
                <b>3. Sistemas</b>
                <span>Monitorea preparación técnica, incidencias y trazabilidad de integraciones futuras.</span>
            </article>
        </section>

        <footer class="foot">
            <span><strong>Estado institucional:</strong> operación documental activa con enfoque API-first.</span>
            <span><strong class="gold">Nota:</strong> firma real, since-service, Jasper y PDF oficial se mantienen fuera de esta fase.</span>
        </footer>
    </main>
</body>
</html>