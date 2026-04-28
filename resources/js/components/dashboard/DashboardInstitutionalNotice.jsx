import { AlertBox } from '../ui/AlertBox';

export function DashboardInstitutionalNotice({ message, type = 'warning' }) {
    return <AlertBox type={type} message={message} />;
}
