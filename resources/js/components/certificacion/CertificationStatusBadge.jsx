import { EsStatusBadge } from '../educacionSuperior';

const MAP = {
    blue: 'blue',
    green: 'green',
    yellow: 'yellow',
    orange: 'yellow',
    purple: 'purple',
    red: 'red',
    gray: 'gray',
};

export function CertificationStatusBadge({ badge = 'blue', children }) {
    return <EsStatusBadge color={MAP[badge] ?? 'blue'}>{children}</EsStatusBadge>;
}
