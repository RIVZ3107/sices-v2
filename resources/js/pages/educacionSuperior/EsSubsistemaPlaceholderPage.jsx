import { Link } from 'react-router-dom';
import { EsHeaderAction, EsPageLayout } from '../../components/educacionSuperior';

/**
 * Placeholder de rutas futuras por subsistema (Normales / UPN).
 * Sin lógica de negocio hasta que exista el módulo correspondiente.
 */
export function EsSubsistemaPlaceholderPage({ subsistema, modulo, descripcion }) {
    const base =
        subsistema === 'upn'
            ? '/app/educacion-superior/upn'
            : '/app/educacion-superior/normales';
    const certPath = `${base}/certificacion`;

    return (
        <EsPageLayout
            breadcrumbCurrent={modulo}
            title={`${modulo} — ${subsistema === 'upn' ? 'UPN' : 'Escuelas Normales'}`}
            subtitle={descripcion}
            actions={<EsHeaderAction to={certPath} label="Ir a certificación" variant="secondary" />}
        >
            <div className="inst-surface p-6 text-sm text-slate-600">
                <p style={{ margin: '0 0 12px' }}>
                    Módulo en preparación. La arquitectura de rutas ya está separada por subsistema; la implementación
                    operativa se conectará en un bloque posterior.
                </p>
                <Link to={certPath} className="text-blue-700 hover:underline">
                    Volver a certificación
                </Link>
            </div>
        </EsPageLayout>
    );
}
