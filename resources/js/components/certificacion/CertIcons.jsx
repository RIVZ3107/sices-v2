const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 };

function I({ children }) {
    return <svg {...base}>{children}</svg>;
}

export const CertIcons = {
    dashboard: <I><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></I>,
    inbox: <I><path d="M22 12h-6l-2 3H10l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></I>,
    docs: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></I>,
    file: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M9 13h6M9 17h4" /></I>,
    signature: <I><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></I>,
    truck: <I><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></I>,
    chart: <I><path d="M3 3v18h18" /><path d="M7 16v-5m5 5V8m5 8v-2" /></I>,
    settings: <I><circle cx="12" cy="12" r="3" /><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></I>,
    bell: <I><path d="M15 18H9m9-2H6l1.2-1.2A2 2 0 0 0 8 13.4V11a4 4 0 1 1 8 0v2.4a2 2 0 0 0 .8 1.4L18 16Z" /><path d="M10 18a2 2 0 0 0 4 0" /></I>,
    collapse: <I><path d="m15 18-6-6 6-6" /></I>,
    expand: <I><path d="m9 18 6-6-6-6" /></I>,
    search: <I><path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></I>,
    user: <I><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></I>,
    shield: <I><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></I>,
};
