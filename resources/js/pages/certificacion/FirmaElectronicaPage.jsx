import { useState } from 'react';

import { Link } from 'react-router-dom';

import {

    CertificacionPageHeader,

    CertificacionPlaceholder,

    CertificacionTable,

    CertTableLink,

    certTheme,

} from '../../components/certificacion';

import { useCertificacionBandeja } from '../../hooks/useCertificacionBandeja';

import { CERT_PERM } from '../../utils/certificacionPermissions';

import { userCanAny } from '../../utils/userPermissions';



const TABS = [

    { key: 'listos-para-firma', label: 'Pendientes de firma' },

    { key: 'firmados', label: 'Firmados' },

    { key: 'errores-firma', label: 'Error de firma' },

];



export function FirmaElectronicaPage() {

    const [tab, setTab] = useState('listos-para-firma');

    const { rows, error, loading } = useCertificacionBandeja(tab, {});



    const canEjecutarFirma = userCanAny(CERT_PERM.firmaEjecutar);

    const canProcesoTecnico = userCanAny(CERT_PERM.procesoTecnico);



    return (

        <div style={certTheme.pageShell}>

            <CertificacionPageHeader

                title="Firma electrónica"

                subtitle="Seguimiento institucional del estado de firma SEP/SINCE. Sin ejecución técnica desde Certificación."

            />



            <CertificacionPlaceholder

                type="info"

                title="Vista de seguimiento — no ejecución"

                detail={

                    canEjecutarFirma

                        ? 'Este módulo no incluye el botón «Firmar SEP». La firma oficial (servicio 34, cadena, XML, preflight) se ejecuta únicamente en Proceso técnico de certificación (Sistemas), con permisos técnicos.'

                        : 'Su perfil consulta el avance de firma. No hay botón «Firmar SEP» ni llamadas al servicio 34 desde aquí. Coordine con Sistemas para la firma oficial.'

                }

            />



            <div className="cert-tabs">

                {TABS.map((t) => (

                    <button

                        key={t.key}

                        type="button"

                        className={`cert-tab-btn ${tab === t.key ? 'active' : ''}`}

                        onClick={() => setTab(t.key)}

                    >

                        {t.label}

                    </button>

                ))}

            </div>



            <CertificacionTable

                rows={rows}

                loading={loading}

                error={error}

                columns={[

                    { key: 'folio', label: 'Folio', render: (r) => r.folio_interno ?? `#${r.id}` },

                    { key: 'alumno', label: 'Alumno', render: (r) => r.alumno?.nombre_completo ?? '—' },

                    { key: 'firmante', label: 'Firmante', render: () => 'SEP / SINCE' },

                    {

                        key: 'fecha',

                        label: 'Fecha firma',

                        render: (r) =>

                            r.fecha_firma

                                ? new Date(r.fecha_firma).toLocaleString('es-MX')

                                : '—',

                    },

                    { key: 'estado', label: 'Estado', render: (r) => r.estado_firma ?? r.estado_workflow ?? '—' },

                    { key: 'folio_sep', label: 'Folio digital', render: (r) => r.folio_digital_sep ?? '—' },

                ]}

                renderActions={(row) => (

                    <>

                        <CertTableLink to={`/app/documentos/${row.id}`}>Ver estado</CertTableLink>

                        {canProcesoTecnico ? (

                            <CertTableLink to={`/app/sistemas/proceso-tecnico-certificacion/${row.id}`}>

                                Proceso técnico (Sistemas)

                            </CertTableLink>

                        ) : null}

                    </>

                )}

            />



            {canProcesoTecnico ? (

                <p style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>

                    Con permisos técnicos puede abrir{' '}

                    <Link to="/app/sistemas/proceso-tecnico-certificacion" style={certTheme.link}>

                        Proceso técnico de certificación

                    </Link>

                    . No use esta pantalla para firmar.

                </p>

            ) : null}



            <CertificacionPlaceholder

                detail="No se invoca el servicio 34 ni se escribe Informix desde esta pantalla."

            />

        </div>

    );

}


