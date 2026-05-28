import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CertificacionPageHeader,
    CertificacionPlaceholder,
    certTheme,
} from '../../components/certificacion';
import { userCanAny } from '../../utils/userPermissions';
import { CERT_PERM } from '../../utils/certificacionPermissions';

const TABS = [
    { key: 'tipos', label: 'Tipos de documento', perm: ['catalogos.ver', 'catalogos.configurar', 'configuracion.ver'] },
    { key: 'plantillas', label: 'Plantillas', perm: ['configuracion.ver', 'configuracion.configurar'] },
    { key: 'firmantes', label: 'Firmantes', perm: ['configuracion.ver', 'configuracion.configurar'] },
    { key: 'folios', label: 'Series y folios', perm: ['configuracion.ver', 'folios.asignar', 'preparar_documento_firma'] },
    { key: 'parametros', label: 'Parámetros', perm: CERT_PERM.configuracion },
];

export function ConfiguracionCertificacionPage() {
    const [tab, setTab] = useState('tipos');
    const visibleTabs = TABS.filter((t) => userCanAny(t.perm));
    const active = visibleTabs.find((t) => t.key === tab) ?? visibleTabs[0];

    if (visibleTabs.length === 0) {
        return (
            <CertificacionPlaceholder
                title="Sin acceso"
                detail="No cuenta con permisos de configuración en este módulo."
                type="warn"
            />
        );
    }

    return (
        <div style={certTheme.pageShell}>
            <CertificacionPageHeader
                title="Configuración de certificación"
                subtitle="Parámetros institucionales, plantillas y firmantes. Operación técnica en Sistemas."
            />

            <div className="cert-tabs">
                {visibleTabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`cert-tab-btn ${(active?.key ?? tab) === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={certTheme.card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>{active?.label}</h3>
                <CertificacionPlaceholder
                    detail={`La administración de ${active?.label?.toLowerCase()} se centralizará en catálogos y parámetros del sistema. Use los enlaces según su permiso.`}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                    {userCanAny(['catalogos.ver', 'catalogos.configurar']) ? (
                        <Link to="/app/admin/catalogos" style={certTheme.btnSecondary}>
                            Catálogos académicos
                        </Link>
                    ) : null}
                    {userCanAny(['configuracion.ver', 'configuracion.configurar']) ? (
                        <Link to="/app/admin/parametros" style={certTheme.btnSecondary}>
                            Parámetros del sistema
                        </Link>
                    ) : null}
                    {userCanAny(['sistemas.integraciones.ver', 'integraciones.ver']) ? (
                        <Link to="/app/sistemas/configuracion" style={certTheme.btnSecondary}>
                            Integraciones (Sistemas)
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
