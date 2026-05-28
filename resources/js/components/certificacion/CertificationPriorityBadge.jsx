import { CertificationStatusBadge } from './CertificationStatusBadge';

export function CertificationPriorityBadge({ badge, label }) {
    return <CertificationStatusBadge badge={badge}>{label}</CertificationStatusBadge>;
}
