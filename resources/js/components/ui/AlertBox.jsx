export function AlertBox({ type = 'info', message }) {
    const cls =
        type === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : type === 'danger'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700';

    return <div className={`rounded-lg border p-3 text-sm ${cls}`}>{message}</div>;
}
