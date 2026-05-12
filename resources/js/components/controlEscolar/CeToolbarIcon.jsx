import { isValidElement } from 'react';

const S = {
    w: 22,
    h: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};

function Svg({ children, ...rest }) {
    return (
        <svg {...S} {...rest}>
            {children}
        </svg>
    );
}

function IconUserPlus() {
    return (
        <Svg>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
        </Svg>
    );
}

function IconClipboardList() {
    return (
        <Svg>
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
        </Svg>
    );
}

function IconRefreshCw() {
    return (
        <Svg>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </Svg>
    );
}

function IconFileText() {
    return (
        <Svg>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </Svg>
    );
}

function IconGraduationCap() {
    return (
        <Svg>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </Svg>
    );
}

function IconMoreHorizontal() {
    return (
        <Svg>
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </Svg>
    );
}

function IconArrowDownTray() {
    return (
        <Svg>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </Svg>
    );
}

function IconArrowUpTray() {
    return (
        <Svg>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </Svg>
    );
}

function IconFunnel() {
    return (
        <Svg>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </Svg>
    );
}

function IconCheck() {
    return (
        <Svg>
            <path d="M20 6 9 17l-5-5" />
        </Svg>
    );
}

function IconPrinter() {
    return (
        <Svg>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </Svg>
    );
}

function IconEye() {
    return (
        <Svg>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </Svg>
    );
}

function IconAlertTriangle() {
    return (
        <Svg>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </Svg>
    );
}

function IconFolder() {
    return (
        <Svg>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </Svg>
    );
}

function IconFolderOpen() {
    return (
        <Svg>
            <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
        </Svg>
    );
}

function IconEnvelope() {
    return (
        <Svg>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </Svg>
    );
}

function IconCog() {
    return (
        <Svg>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </Svg>
    );
}

function IconX() {
    return (
        <Svg>
            <path d="M18 6 6 18M6 6l12 12" />
        </Svg>
    );
}

function IconUsers() {
    return (
        <Svg>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
    );
}

function IconPencil() {
    return (
        <Svg>
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </Svg>
    );
}

function IconBarChart2() {
    return (
        <Svg>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </Svg>
    );
}

function IconTable() {
    return (
        <Svg>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
        </Svg>
    );
}

function IconClock() {
    return (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </Svg>
    );
}

function IconBookOpen() {
    return (
        <Svg>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </Svg>
    );
}

function IconCloudUpload() {
    return (
        <Svg>
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
        </Svg>
    );
}

function IconLockOpen() {
    return (
        <Svg>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </Svg>
    );
}

function IconSend() {
    return (
        <Svg>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </Svg>
    );
}

function IconPaperclip() {
    return (
        <Svg>
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.38-8.38A4 4 0 1 1 18 12l-8.38 8.38a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </Svg>
    );
}

function IconMessageCircle() {
    return (
        <Svg>
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </Svg>
    );
}

function IconScrollText() {
    return (
        <Svg>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
        </Svg>
    );
}

function IconCornerUpLeft() {
    return (
        <Svg>
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </Svg>
    );
}

function IconArrowsLeftRight() {
    return (
        <Svg>
            <polyline points="7 16 3 12 7 8" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <polyline points="17 8 21 12 17 16" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </Svg>
    );
}

function IconPlus() {
    return (
        <Svg>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
    );
}

/** Claves usadas en toolbars CeShell (Control Escolar / Dirección). */
const MAP = {
    userPlus: IconUserPlus,
    clipboardList: IconClipboardList,
    refreshCw: IconRefreshCw,
    fileText: IconFileText,
    graduationCap: IconGraduationCap,
    moreHorizontal: IconMoreHorizontal,
    arrowDownTray: IconArrowDownTray,
    arrowUpTray: IconArrowUpTray,
    funnel: IconFunnel,
    check: IconCheck,
    printer: IconPrinter,
    eye: IconEye,
    alertTriangle: IconAlertTriangle,
    folder: IconFolder,
    folderOpen: IconFolderOpen,
    envelope: IconEnvelope,
    cog: IconCog,
    x: IconX,
    users: IconUsers,
    pencil: IconPencil,
    barChart2: IconBarChart2,
    table: IconTable,
    clock: IconClock,
    bookOpen: IconBookOpen,
    cloudUpload: IconCloudUpload,
    lockOpen: IconLockOpen,
    send: IconSend,
    paperclip: IconPaperclip,
    messageCircle: IconMessageCircle,
    scrollText: IconScrollText,
    cornerUpLeft: IconCornerUpLeft,
    arrowsLeftRight: IconArrowsLeftRight,
    plus: IconPlus,
};

/**
 * Icono para tarjetas de acción del contrato CE/DE.
 * Acepta clave string (registro MAP) o nodo React ya renderizado.
 */
export function CeToolbarIcon({ icon }) {
    if (icon == null) {
        return null;
    }
    if (isValidElement(icon)) {
        return icon;
    }
    if (typeof icon === 'string' && MAP[icon]) {
        const Cmp = MAP[icon];
        return <Cmp />;
    }
    return null;
}
