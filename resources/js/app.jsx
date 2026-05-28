import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './bootstrap';
import '../css/app.css';
import './styles/sices-ui.css';
import './styles/sices-institucional.css';
import './styles/certificacion.css';
import { router } from './router';
import { SicesThemeProvider } from './theme/SicesThemeProvider';

const rootNode = document.getElementById('app');

if (rootNode) {
    createRoot(rootNode).render(
        <React.StrictMode>
            <SicesThemeProvider>
                <RouterProvider router={router} />
            </SicesThemeProvider>
        </React.StrictMode>,
    );
}
