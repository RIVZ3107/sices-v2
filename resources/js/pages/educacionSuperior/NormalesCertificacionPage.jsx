/**
 * Bandeja operativa de certificación — Escuelas Normales.
 * Reutiliza EsCertificacionPage (sin duplicar lógica de bandeja/KPIs).
 */
import { EsCertificacionPage } from './EsCertificacionPage';

export function NormalesCertificacionPage() {
    return <EsCertificacionPage subsistema="normales" />;
}
