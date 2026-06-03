import React from 'react';
import { Link } from 'react-router-dom';
import { CeIcons, ceTheme } from '../../../components/controlEscolar';
import { canAlumnos } from './alumnosPermissions';

export function AlumnoRowActions({ row }) {
    const urls = row.urls ?? {};
    const actions = [
        { key: 'expediente', to: urls.expediente, icon: CeIcons.eye, title: 'Ver expediente', show: canAlumnos('ver') },
        { key: 'editar', to: urls.editar, icon: CeIcons.pencil, title: 'Editar alumno', show: canAlumnos('editar') },
        { key: 'matricula', to: urls.matricula, icon: CeIcons.scrollText, title: 'Ver matrícula', show: canAlumnos('ver') && urls.matricula },
        { key: 'kardex', to: urls.kardex, icon: CeIcons.graduationCap, title: 'Kardex', show: canAlumnos('kardex') },
        { key: 'constancia', to: urls.constancia, icon: CeIcons.file, title: 'Generar constancia', show: canAlumnos('constancia') },
    ].filter((a) => a.show && a.to);

    return (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {actions.map((a) => (
                <Link key={a.key} to={a.to} title={a.title} style={{ ...ceTheme.iconBtn, width: 28, height: 28 }}>
                    {a.icon}
                </Link>
            ))}
        </div>
    );
}
