import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './bootstrap';
import '../css/app.css';
import './styles/sices-ui.css';
import './styles/sices-institucional.css';
import { router } from './router';

const rootNode = document.getElementById('app');

if (rootNode) {
    createRoot(rootNode).render(
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>,
    );
}
