import { CertificationStatusBadge } from '../certificacion/CertificationStatusBadge';

export function UpnCertificateStatusBadge({ estatus }) {
    if (!estatus) return <span>—</span>;
    return <CertificationStatusBadge badge={estatus.badge}>{estatus.label}</CertificationStatusBadge>;
}
