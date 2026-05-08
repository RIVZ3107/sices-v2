export function SubsystemBadge({ label }) {
    const txt = (label || '').toLowerCase();
    const tone = txt.includes('upn') ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800';
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
            {label || 'Subsistema'}
        </span>
    );
}

