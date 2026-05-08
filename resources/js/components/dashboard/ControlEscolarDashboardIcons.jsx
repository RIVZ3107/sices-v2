/** Iconos outline 24px para métricas y acciones (sin emojis). */

function Ico({ children, className = '' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            {children}
        </svg>
    );
}

export function IconUsers({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Ico>
    );
}

export function IconClipboard({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
        </Ico>
    );
}

export function IconBooks({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            <path d="M9 7h6" />
        </Ico>
    );
}

export function IconLayers({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="m12.83 2.18 8 3.33v14l-8 3.33-8-3.33V5.51l8-3.33Z" />
            <path d="M4.83 5.51 12.83 8.84l8-3.33" />
            <path d="m4.83 12.01 8 3.34 8-3.34" />
        </Ico>
    );
}

export function IconPenLine({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </Ico>
    );
}

export function IconAlertTriangle({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </Ico>
    );
}

export function IconCircleCheck({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
        </Ico>
    );
}

export function IconMessage({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </Ico>
    );
}

export function IconSearchDoc({ className = 'h-[18px] w-[18px]' }) {
    return (
        <Ico className={className}>
            <path d="M14 3H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7" />
            <path d="M14 3v6h6" />
            <circle cx="16.5" cy="17.5" r="3.5" />
            <path d="M21 21l-2.35-2.35" />
        </Ico>
    );
}

export function IconFilePlus({ className = 'h-4 w-4' }) {
    return (
        <Ico className={className}>
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
            <path d="M14 3v6h6" />
            <path d="M16 19h6" />
            <path d="M19 16v6" />
        </Ico>
    );
}

export function IconRoute({ className = 'h-4 w-4' }) {
    return (
        <Ico className={className}>
            <circle cx="6" cy="19" r="2" />
            <path d="M9 19h8.5a2.5 2.5 0 0 0 0-5H9a2 2 0 0 1 0-4h9" />
            <circle cx="18" cy="5" r="2" />
        </Ico>
    );
}

export function IconUserPlus({ className = 'h-4 w-4' }) {
    return (
        <Ico className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
        </Ico>
    );
}

export function IconUpload({ className = 'h-4 w-4' }) {
    return (
        <Ico className={className}>
            <path d="M12 3v12" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 21h14" />
        </Ico>
    );
}

const METRIC_ICONS = {
    users: IconUsers,
    clipboard: IconClipboard,
    books: IconBooks,
    layers: IconLayers,
    pen: IconPenLine,
    alert: IconAlertTriangle,
    check: IconCircleCheck,
    message: IconMessage,
    search: IconSearchDoc,
};

export function MetricIcon({ name }) {
    const Cmp = METRIC_ICONS[name] ?? IconUsers;
    return <Cmp />;
}
