import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { MetricIcon } from '../../components/dashboard/ControlEscolarDashboardIcons';
import { useDashboardResumen } from './useDashboardResumen';

const COLORS = {
    primary: '#185FA5',
    sidebar: '#0B1F4D',
    hover: '#1D4ED8',
    active: '#2563EB',
    success: '#0F6E56',
    purple: '#534AB7',
    warning: '#BA7517',
    danger: '#DC2626',
    background: '#f8fafc',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
};

function MetricCard({
    title,
    value,
    href,
    icon,
    color,
    bg,
}) {
    return (
        <article
            style={{
                background: 'white',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                minHeight: 120,
            }}
        >
            <div
                style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>

            <div style={{ flex: 1 }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: 13,
                        color: COLORS.muted,
                        fontWeight: 500,
                        marginBottom: 6,
                    }}
                >
                    {title}
                </p>

                <h3
                    style={{
                        margin: 0,
                        fontSize: 32,
                        lineHeight: 1,
                        color: COLORS.text,
                        fontWeight: 700,
                    }}
                >
                    {value}
                </h3>

                {href ? (
                    <Link
                        to={href}
                        style={{
                            display: 'inline-flex',
                            marginTop: 12,
                            textDecoration: 'none',
                            color: COLORS.primary,
                            fontSize: 12,
                            fontWeight: 600,
                        }}
                    >
                        Abrir módulo
                    </Link>
                ) : null}
            </div>
        </article>
    );
}

function ActionButton({
    to,
    children,
    primary = false,
}) {
    const baseStyles = {
        height: 40,
        padding: '0 16px',
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 600,
        transition: 'all .2s ease',
        whiteSpace: 'nowrap',
    };

    if (primary) {
        return (
            <Link
                to={to}
                style={{
                    ...baseStyles,
                    background: COLORS.primary,
                    border: `1px solid ${COLORS.primary}`,
                    color: 'white',
                }}
            >
                {children}
            </Link>
        );
    }

    return (
        <Link
            to={to}
            style={{
                ...baseStyles,
                background: 'white',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
            }}
        >
            {children}
        </Link>
    );
}

export function EducacionSuperiorDashboardPage() {
    const { error, fullPayload } = useDashboardResumen();

    const data = fullPayload;
    const loading = fullPayload === null && !error;

    if (loading) {
        return (
            <LoadingState text="Cargando tablero de Educación Superior..." />
        );
    }

    if (error && data === null) {
        return (
            <section
                style={{
                    display: 'grid',
                    gap: 16,
                }}
            >
                <PageHeader
                    title="Educación Superior"
                    subtitle="Autoridad académica central para Educación Normal y UPN."
                />

                <ErrorState message={error} />
            </section>
        );
    }

    const contexto = {
        subsistema:
            data?.contexto?.subsistema ??
            'Educación Normal y UPN',

        institucion:
            data?.contexto?.institucion ??
            'Coordinación',

        sede:
            data?.contexto?.sede ??
            'Según perfil',

        ciclo:
            data?.contexto?.ciclo_escolar ??
            'Ciclo vigente',
    };

    const m = data?.metricas ?? {};

    const cards = Array.isArray(data?.cards)
        ? data.cards
        : [
              {
                  key: 'inst',
                  title: 'Instituciones activas',
                  value: m.instituciones_activas ?? 0,
                  href: '/app/educacion-superior/instituciones',
              },

              {
                  key: 'sed',
                  title: 'Sedes / subsedes',
                  value: m.sedes_registradas ?? 0,
                  href: '/app/educacion-superior/sedes',
              },
          ];

    const iconFor = (title) => {
        if (title.includes('Instituciones')) {
            return (
                <MetricIcon name="users" />
            );
        }

        if (title.includes('Sedes')) {
            return (
                <MetricIcon name="users" />
            );
        }

        if (title.includes('Programas')) {
            return (
                <MetricIcon name="books" />
            );
        }

        if (title.includes('Planes')) {
            return (
                <MetricIcon name="pen" />
            );
        }

        if (title.includes('Solicitudes')) {
            return (
                <MetricIcon name="clipboard" />
            );
        }

        if (
            title.includes('validación') ||
            title.includes('Validación')
        ) {
            return (
                <MetricIcon name="search" />
            );
        }

        if (
            title.includes('egreso') ||
            title.includes('Egreso')
        ) {
            return (
                <MetricIcon name="check" />
            );
        }

        return (
            <MetricIcon name="clipboard" />
        );
    };

    const colorFor = (title) => {
        if (
            title.includes('Alertas') ||
            title.includes('pendientes')
        ) {
            return {
                bg: '#FEE2E2',
                color: COLORS.danger,
            };
        }

        if (
            title.includes('emitidos') ||
            title.includes('asignadas')
        ) {
            return {
                bg: '#DCFCE7',
                color: COLORS.success,
            };
        }

        if (
            title.includes('Programas')
        ) {
            return {
                bg: '#EDE9FE',
                color: COLORS.purple,
            };
        }

        return {
            bg: '#DBEAFE',
            color: COLORS.primary,
        };
    };

    const tabla =
        data?.tabla_solicitudes_matricula;

    const filas = Array.isArray(tabla?.filas)
        ? tabla.filas
        : [];

    const filasNorm = Array.isArray(
        data?.tabla_expedientes_normativa?.filas
    )
        ? data.tabla_expedientes_normativa
              .filas
        : [];

    const filasLib = Array.isArray(
        data?.tabla_documentos_pendientes_liberar
            ?.filas
    )
        ? data
              .tabla_documentos_pendientes_liberar
              .filas
        : [];

    const alertas = Array.isArray(
        data?.alertas_normativas
    )
        ? data.alertas_normativas
        : [];

    const matInst = Array.isArray(
        data?.matricula_por_institucion
    )
        ? data.matricula_por_institucion
        : [];

    const matSub = Array.isArray(
        data?.matricula_por_subsistema
    )
        ? data.matricula_por_subsistema
        : [];

    const reportes = Array.isArray(
        data?.reportes_frecuentes
    )
        ? data.reportes_frecuentes
        : [];

    return (
        <section
            style={{
                background: COLORS.background,
                minHeight: '100vh',
                padding: '24px 32px',
                fontFamily:
                    'system-ui, -apple-system, sans-serif',
                display: 'grid',
                gap: 20,
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: 'flex',
                    justifyContent:
                        'space-between',
                    alignItems: 'flex-start',
                    gap: 20,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                            fontSize: 13,
                            color: COLORS.primary,
                            fontWeight: 600,
                        }}
                    >
                        Educ. Superior
                        <span
                            style={{
                                color: '#94a3b8',
                            }}
                        >
                            ›
                        </span>
                        Dashboard
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: 36,
                            fontWeight: 700,
                            color: COLORS.text,
                            lineHeight: 1.1,
                        }}
                    >
                        Educación Superior
                    </h1>

                    <p
                        style={{
                            margin: '10px 0 0',
                            fontSize: 14,
                            color: COLORS.muted,
                            maxWidth: 900,
                            lineHeight: 1.6,
                        }}
                    >
                        Autoridad académica central:
                        instituciones, sedes,
                        programas, planes,
                        solicitudes de matrícula,
                        validación normativa,
                        certificación y reportes
                        oficiales (Normal / UPN).
                    </p>
                </div>

                {/* BOTONES */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                    }}
                >
                    <ActionButton
                        to="/app/educacion-superior/instituciones"
                        primary
                    >
                        Instituciones
                    </ActionButton>

                    <ActionButton to="/app/solicitudes-matricula">
                        Solicitudes
                    </ActionButton>

                    <ActionButton to="/app/educacion-superior/validaciones-normativas">
                        Validaciones
                    </ActionButton>

                    <ActionButton to="/app/educacion-superior/normales/certificacion">
                        Certificación
                    </ActionButton>

                    <ActionButton to="/app/notificaciones">
                        Notificaciones
                    </ActionButton>
                </div>
            </div>

            {error ? (
                <ErrorState message={error} />
            ) : null}

            {/* CONTEXTO */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit,minmax(220px,1fr))',
                    gap: 16,
                }}
            >
                {[
                    {
                        label: 'Alcance',
                        value:
                            contexto.subsistema,
                    },

                    {
                        label: 'Coordinación',
                        value:
                            contexto.institucion,
                    },

                    {
                        label:
                            'Sede / unidad',
                        value:
                            contexto.sede,
                    },

                    {
                        label:
                            'Ciclo escolar',
                        value:
                            contexto.ciclo,
                    },
                ].map((item) => (
                    <article
                        key={item.label}
                        style={{
                            background:
                                'white',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: 18,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12,
                                color: COLORS.muted,
                                marginBottom: 8,
                                fontWeight: 500,
                            }}
                        >
                            {item.label}
                        </p>

                        <p
                            style={{
                                margin: 0,
                                fontSize: 15,
                                color: COLORS.text,
                                fontWeight: 700,
                            }}
                        >
                            {item.value}
                        </p>
                    </article>
                ))}
            </div>

            {/* CARDS */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit,minmax(260px,1fr))',
                    gap: 16,
                }}
            >
                {cards.map((card) => {
                    const tones =
                        colorFor(card.title);

                    return (
                        <MetricCard
                            key={card.key}
                            title={card.title}
                            value={
                                card.value ?? 0
                            }
                            href={card.href}
                            icon={iconFor(
                                card.title
                            )}
                            bg={tones.bg}
                            color={
                                tones.color
                            }
                        />
                    );
                })}
            </div>

            {/* GRID */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        '1fr 1fr',
                    gap: 20,
                }}
            >
                {/* MATRICULA INST */}
                <div
                    style={{
                        background: 'white',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: 20,
                            borderBottom: `1px solid ${COLORS.border}`,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 16,
                                fontWeight: 700,
                                color: COLORS.text,
                            }}
                        >
                            Matrícula por
                            institución
                        </h3>
                    </div>

                    <div
                        style={{
                            overflowX: 'auto',
                        }}
                    >
                        <table
                            style={{
                                width: '100%',
                                borderCollapse:
                                    'collapse',
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            '#f8fafc',
                                    }}
                                >
                                    <th
                                        style={{
                                            padding:
                                                '14px 16px',
                                            textAlign:
                                                'left',
                                            fontSize: 12,
                                            color:
                                                COLORS.muted,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Institución
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                '14px 16px',
                                            textAlign:
                                                'left',
                                            fontSize: 12,
                                            color:
                                                COLORS.muted,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Matrícula
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {matInst.length ===
                                0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                2
                                            }
                                            style={{
                                                padding:
                                                    20,
                                                color:
                                                    COLORS.muted,
                                            }}
                                        >
                                            Sin
                                            datos.
                                        </td>
                                    </tr>
                                ) : (
                                    matInst.map(
                                        (
                                            row,
                                            idx
                                        ) => (
                                            <tr
                                                key={`${row.institucion}-${idx}`}
                                                style={{
                                                    borderTop: `1px solid ${COLORS.border}`,
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding:
                                                            '14px 16px',
                                                        fontSize: 13,
                                                        color:
                                                            COLORS.text,
                                                    }}
                                                >
                                                    {
                                                        row.institucion
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            '14px 16px',
                                                        fontSize: 13,
                                                        color:
                                                            COLORS.primary,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {
                                                        row.matricula_activa
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SUBSISTEMA */}
                <div
                    style={{
                        background: 'white',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: 20,
                            borderBottom: `1px solid ${COLORS.border}`,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 16,
                                fontWeight: 700,
                                color: COLORS.text,
                            }}
                        >
                            Matrícula por
                            subsistema
                        </h3>
                    </div>

                    <div
                        style={{
                            overflowX: 'auto',
                        }}
                    >
                        <table
                            style={{
                                width: '100%',
                                borderCollapse:
                                    'collapse',
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            '#f8fafc',
                                    }}
                                >
                                    <th
                                        style={{
                                            padding:
                                                '14px 16px',
                                            textAlign:
                                                'left',
                                            fontSize: 12,
                                            color:
                                                COLORS.muted,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Subsistema
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                '14px 16px',
                                            textAlign:
                                                'left',
                                            fontSize: 12,
                                            color:
                                                COLORS.muted,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Matrícula
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {matSub.length ===
                                0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                2
                                            }
                                            style={{
                                                padding:
                                                    20,
                                                color:
                                                    COLORS.muted,
                                            }}
                                        >
                                            Sin
                                            datos.
                                        </td>
                                    </tr>
                                ) : (
                                    matSub.map(
                                        (
                                            row,
                                            idx
                                        ) => (
                                            <tr
                                                key={`${row.subsistema}-${idx}`}
                                                style={{
                                                    borderTop: `1px solid ${COLORS.border}`,
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding:
                                                            '14px 16px',
                                                        fontSize: 13,
                                                        color:
                                                            COLORS.text,
                                                    }}
                                                >
                                                    {
                                                        row.subsistema
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            '14px 16px',
                                                        fontSize: 13,
                                                        color:
                                                            COLORS.primary,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {
                                                        row.matricula_activa
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* REPORTES */}
            <section
                style={{
                    background: 'white',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 20,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent:
                            'space-between',
                        alignItems: 'center',
                        marginBottom: 18,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 700,
                            color: COLORS.text,
                        }}
                    >
                        Reportes oficiales
                        frecuentes
                    </h3>

                    <ActionButton to="/app/admin/reportes-basicos">
                        Abrir reportes
                    </ActionButton>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gap: 12,
                    }}
                >
                    {reportes.map((r) => (
                        <Link
                            key={r.titulo}
                            to={r.ruta}
                            style={{
                                textDecoration:
                                    'none',
                                padding:
                                    '14px 16px',
                                borderRadius: 10,
                                border: `1px solid ${COLORS.border}`,
                                color:
                                    COLORS.primary,
                                fontSize: 14,
                                fontWeight: 600,
                                background:
                                    '#f8fafc',
                            }}
                        >
                            {r.titulo}
                        </Link>
                    ))}
                </div>
            </section>

            {/* SOLICITUDES */}
            {filas.length > 0 ? (
                <section
                    style={{
                        background:
                            'white',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: 20,
                            borderBottom: `1px solid ${COLORS.border}`,
                            display: 'flex',
                            justifyContent:
                                'space-between',
                            alignItems:
                                'center',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: 700,
                                color:
                                    COLORS.text,
                            }}
                        >
                            {tabla?.titulo ??
                                'Solicitudes de matrícula'}
                        </h2>

                        <ActionButton to="/app/solicitudes-matricula">
                            Ir a solicitudes
                        </ActionButton>
                    </div>

                    <div
                        style={{
                            overflowX: 'auto',
                        }}
                    >
                        <table
                            style={{
                                width: '100%',
                                borderCollapse:
                                    'collapse',
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            '#f8fafc',
                                    }}
                                >
                                    {[
                                        'Alumno',
                                        'CURP',
                                        'Estado',
                                        'Acciones',
                                    ].map(
                                        (
                                            h
                                        ) => (
                                            <th
                                                key={
                                                    h
                                                }
                                                style={{
                                                    padding:
                                                        '14px 16px',
                                                    textAlign:
                                                        'left',
                                                    fontSize: 12,
                                                    color:
                                                        COLORS.muted,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {
                                                    h
                                                }
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {filas.map(
                                    (
                                        row
                                    ) => (
                                        <tr
                                            key={
                                                row.id
                                            }
                                            style={{
                                                borderTop: `1px solid ${COLORS.border}`,
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding:
                                                        '14px 16px',
                                                    fontSize: 13,
                                                    color:
                                                        COLORS.text,
                                                }}
                                            >
                                                {row.alumno ||
                                                    '—'}
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        '14px 16px',
                                                    fontSize: 12,
                                                    color:
                                                        COLORS.muted,
                                                    fontFamily:
                                                        'monospace',
                                                }}
                                            >
                                                {row.curp ||
                                                    '—'}
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        '14px 16px',
                                                    fontSize: 13,
                                                    color:
                                                        COLORS.warning,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {
                                                    row.estado
                                                }
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        '14px 16px',
                                                }}
                                            >
                                                <Link
                                                    to={`${row.href ?? '/app/solicitudes-matricula'}?highlight=${row.id}`}
                                                    style={{
                                                        color:
                                                            COLORS.primary,
                                                        textDecoration:
                                                            'none',
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    Revisar
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {/* ALERTAS */}
            {alertas.length > 0 ? (
                <section
                    style={{
                        background:
                            'white',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                        padding: 20,
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                            marginBottom: 16,
                            fontSize: 18,
                            fontWeight: 700,
                            color: COLORS.text,
                        }}
                    >
                        Alertas institucionales
                    </h2>

                    <div
                        style={{
                            display: 'grid',
                            gap: 12,
                        }}
                    >
                        {alertas.map(
                            (
                                a,
                                idx
                            ) => (
                                <div
                                    key={
                                        idx
                                    }
                                    style={{
                                        border: `1px solid ${COLORS.border}`,
                                        borderRadius: 10,
                                        padding:
                                            '14px 16px',
                                        background:
                                            '#fff',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color:
                                                COLORS.text,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {
                                            a.titulo
                                        }
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            color:
                                                COLORS.muted,
                                        }}
                                    >
                                        {
                                            a.institucion
                                        }{' '}
                                        —
                                        folio{' '}
                                        {
                                            a.folio
                                        }
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </section>
            ) : null}
        </section>
    );
}